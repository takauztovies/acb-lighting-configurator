// This is a comment to force re-evaluation of types.
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { withCorsAndSecurityHeaders } from '@/lib/cors-middleware'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'

function verifyAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return false
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin?: boolean }
    if (!decoded.isAdmin) {
      res.status(403).json({ error: 'Admin access required' })
      return false
    }
    return true
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return false
  }
}

// Configure API to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

const uploadDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

interface SnapPointInput {
  name: string
  type: string
  position: [number, number, number]
  rotation?: [number, number, number]
}

interface ComponentInput {
  name: string
  type: string
  description?: string
  model3d?: string
  image?: string
  cardImage?: string
  specifications?: string
  price?: number
  snapPoints?: SnapPointInput[]
}

interface ExtendedComponent {
  id: string
  name: string
  type: string
  description: string | null
  price: number
  model3dUrl: string | null
  imageUrl: string | null
  cardImageUrl: string | null
  metadata: any | null
  snapPoints: any[]
  createdAt: Date
  updatedAt: Date
}

const ALLOWED_MODEL_EXTENSIONS = ['.obj']
const MAX_MODEL_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default withCorsAndSecurityHeaders(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only require admin authentication for write operations
  if (req.method !== 'GET' && !verifyAdmin(req, res)) return
  
  try {
    switch (req.method) {
      case 'GET': {
        const components = await prisma.component.findMany({
          include: {
            snapPoints: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        
        // Transform the data to match the expected format
        const transformedComponents = components.map((component: any) => {
          return {
            id: component.id,
            name: component.name,
            type: component.type,
            description: component.description || '',
            price: component.price,
            image: component.imageUrl || '/placeholder.svg',
            cardImage: component.cardImageUrl || '/placeholder.svg',
            model3d: component.model3dUrl || '',
            specifications: component.metadata ? JSON.parse(component.metadata) : {},
            snapPoints: component.snapPoints.map((sp: any) => ({
              id: sp.id,
              name: sp.name,
              type: sp.type,
              position: JSON.parse(sp.position) as [number, number, number],
              rotation: sp.rotation ? JSON.parse(sp.rotation) as [number, number, number] : undefined
            })),
            createdAt: component.createdAt,
            updatedAt: component.updatedAt
          }
        })
        
        return res.status(200).json(transformedComponents)
      }
      
      case 'POST': {
        // Handle file upload first if present
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          const form = formidable({
            uploadDir,
            keepExtensions: true,
            maxFileSize: 50 * 1024 * 1024, // 50MB for 3D models
            filename: (name, ext) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
              return name.replace(/\.[^/.]+$/, "") + '-' + uniqueSuffix + ext
            }
          })

          const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
              if (err) reject(err)
              else resolve([fields, files])
            })
          })

          // Process uploaded files
          const fileArray = Array.isArray(files.model3d) ? files.model3d : [files.model3d]
          const file = fileArray[0]

          if (file) {
            const filename = path.basename(file.filepath)
            const publicUrl = `/uploads/${filename}`

            // Save file record to database
            const savedFile = await prisma.file.create({
              data: {
                filename: filename,
                url: publicUrl,
                mimetype: file.mimetype || 'model/obj',
                size: file.size || 0,
                filepath: file.filepath,
              },
            })

            // Update fields with file URL
            if (typeof fields === 'object' && fields !== null) {
              const fieldsObj = fields as Record<string, any>
              fieldsObj.model3d = savedFile.url
            }

            // Validate model3d file type and size
            const ext = path.extname(file.originalFilename || '').toLowerCase();
            if (!ALLOWED_MODEL_EXTENSIONS.includes(ext)) {
              return res.status(400).json({ error: 'Invalid model file type' });
            }
            if (file.size > MAX_MODEL_FILE_SIZE) {
              return res.status(400).json({ error: 'Model file too large' });
            }
          }

          // Parse other fields
          const input = fields as unknown as ComponentInput
          
          const component = await prisma.component.create({
            data: {
              name: input.name,
              type: input.type,
              description: input.description,
              model3dUrl: input.model3d,
              imageUrl: input.image,
              cardImageUrl: input.cardImage,
              metadata: input.specifications,
              price: Number(input.price) || 0,
              snapPoints: {
                create: input.snapPoints?.map(sp => ({
                  name: sp.name,
                  type: sp.type,
                  position: JSON.stringify(sp.position),
                  rotation: sp.rotation ? JSON.stringify(sp.rotation) : null
                })) || []
              }
            },
            include: {
              snapPoints: true
            }
          })
          
          return res.status(201).json(component)
        } else {
          {
            let input: ComponentInput;
            if (!req.body || typeof req.body === 'string') {
              // If req.body is a string, parse it
              try {
                let rawBody = req.body;
                if (!rawBody) {
                  // Read the raw stream
                  const buffers = [];
                  for await (const chunk of req) {
                    buffers.push(chunk);
                  }
                  rawBody = Buffer.concat(buffers).toString();
                }
                input = JSON.parse(rawBody || '{}');
              } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON' });
              }
            } else {
              input = req.body as ComponentInput;
            }
          const component = await prisma.component.create({
            data: {
              name: input.name,
              type: input.type,
              description: input.description,
              model3dUrl: input.model3d,
              imageUrl: input.image,
              cardImageUrl: input.cardImage,
              metadata: input.specifications,
              price: Number(input.price) || 0,
              snapPoints: {
                create: input.snapPoints?.map(sp => ({
                  name: sp.name,
                  type: sp.type,
                  position: JSON.stringify(sp.position),
                  rotation: sp.rotation ? JSON.stringify(sp.rotation) : null
                })) || []
              }
            },
            include: {
              snapPoints: true
            }
          })
          return res.status(201).json(component)
          }
        }
      }
      
      case 'PUT': {
        console.log('PUT /api/components raw body:', req.body);
        let body: any = req.body;
        if (!body || typeof body === 'string') {
          try {
            // If req.body is undefined, read the stream
            if (!body) {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              body = Buffer.concat(buffers).toString();
            }
            body = JSON.parse(body || '{}');
          } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON' });
          }
        }
        console.log('PUT /api/components parsed body:', body);
        const { id, ...input } = body as ComponentInput & { id: string };
        if (!id) {
          return res.status(400).json({ error: 'Component id is required for update.' });
        }
        // Check if the component exists before updating
        const existing = await prisma.component.findUnique({ where: { id } });
        if (!existing) {
          return res.status(404).json({ error: 'Component not found for update.' });
        }
        // Update component and its snap points
        const component = await prisma.component.update({
          where: { id },
          data: {
            name: input.name,
            type: input.type,
            description: input.description,
            model3dUrl: input.model3d,
            imageUrl: input.image,
            cardImageUrl: input.cardImage,
            metadata: input.specifications,
            price: Number(input.price) || 0,
            snapPoints: {
              deleteMany: {},
              create: input.snapPoints?.map(sp => ({
                name: sp.name,
                type: sp.type,
                position: JSON.stringify(sp.position),
                rotation: sp.rotation ? JSON.stringify(sp.rotation) : null
              })) || []
            }
          },
          include: {
            snapPoints: true
          }
        });
        return res.status(200).json(component);
      }
      
      case 'DELETE': {
        const { id } = req.query
        
        // Delete component and related data (snap points will be deleted automatically due to onDelete: Cascade)
        await prisma.component.delete({
          where: { id: String(id) }
        })
        
        return res.status(204).end()
      }
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('API Error:', error)
    if (error instanceof Error) {
      return res.status(500).json({ error: 'Internal Server Error', details: error.message })
    }
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}) 