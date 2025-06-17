import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { Component, SnapPoint, Prisma } from '@prisma/client'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

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
  specifications?: Record<string, any>
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
  metadata: Prisma.JsonValue | null
  snapPoints: (SnapPoint & {
    position: string
    rotation: string | null
  })[]
  createdAt: Date
  updatedAt: Date
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        const transformedComponents = components.map((component) => {
          const typedComponent = component as unknown as ExtendedComponent
          return {
            id: typedComponent.id,
            name: typedComponent.name,
            type: typedComponent.type,
            description: typedComponent.description || '',
            price: typedComponent.price,
            image: typedComponent.imageUrl || '/placeholder.svg',
            cardImage: typedComponent.cardImageUrl || '/placeholder.svg',
            model3d: typedComponent.model3dUrl || null,
            specifications: typedComponent.metadata || {},
            snapPoints: typedComponent.snapPoints.map(sp => ({
              id: sp.id,
              name: sp.name,
              type: sp.type,
              position: JSON.parse(sp.position) as [number, number, number],
              rotation: sp.rotation ? JSON.parse(sp.rotation) as [number, number, number] : undefined
            })),
            createdAt: typedComponent.createdAt,
            updatedAt: typedComponent.updatedAt
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
              metadata: input.specifications || {},
              price: Number(input.price) || 0,
              snapPoints: {
                create: input.snapPoints?.map(sp => ({
                  name: sp.name,
                  type: sp.type,
                  position: JSON.stringify(sp.position),
                  rotation: sp.rotation ? JSON.stringify(sp.rotation) : null
                })) || []
              }
            } as Prisma.ComponentCreateInput,
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
                metadata: input.specifications || {},
                price: Number(input.price) || 0,
                snapPoints: {
                  create: input.snapPoints?.map(sp => ({
                    name: sp.name,
                    type: sp.type,
                    position: JSON.stringify(sp.position),
                    rotation: sp.rotation ? JSON.stringify(sp.rotation) : null
                  })) || []
                }
              } as Prisma.ComponentCreateInput,
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
            metadata: input.specifications || {},
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
          } as Prisma.ComponentUpdateInput,
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
} 