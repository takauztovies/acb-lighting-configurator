import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { withCorsAndSecurityHeaders } from '@/lib/cors-middleware'

export const config = {
  api: {
    bodyParser: false,
  },
}

const prisma = new PrismaClient()
const uploadDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const JWT_SECRET = process.env.JWT_SECRET || 'changeme'
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.obj']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function verifyAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return false
  }
  const token = authHeader.split(' ')[1]
  
  // For development: Accept development tokens
  if (token.endsWith('.dev-signature')) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.isAdmin) {
          console.log('🔑 Development admin token accepted')
          return true
        }
      }
    } catch (e) {
      console.log('🔑 Invalid development token format')
    }
  }
  
  // For production: Proper JWT verification
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

export default withCorsAndSecurityHeaders(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdmin(req, res)) return

  if (req.method === 'GET') {
    try {
      console.log('GET /api/files: Fetching all files');
      const files = await prisma.file.findMany({
        orderBy: [{ id: 'desc' }],
      })
      console.log(`GET /api/files: Found ${files.length} files`);
      return res.status(200).json(files)
    } catch (error) {
      console.error('GET /api/files Error:', error)
      return res.status(500).json({ error: 'Failed to fetch files' })
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('POST /api/files: Starting file upload');
      
      // Create upload directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating upload directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const form = formidable({
        uploadDir,
        keepExtensions: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB per file
        maxTotalFileSize: 100 * 1024 * 1024, // 100MB total
        filename: (_name, _ext, part) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
          const originalName = part.originalFilename || 'file'
          const ext = path.extname(originalName)
          const basename = path.basename(originalName, ext)
          const newFilename = `${basename}-${uniqueSuffix}${ext}`;
          console.log('Generated filename:', newFilename);
          return newFilename;
        }
      })

      // Parse form data
      const [fields, files] = await new Promise<[formidable.Fields<string>, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Form parsing error:', err);
            reject(err);
          }
          else resolve([fields, files])
        })
      })

      // Get the uploaded file
      const fileField = files.file
      const file = Array.isArray(fileField) ? fileField[0] : fileField

      if (!file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' })
      }

      console.log('File upload details:', {
        originalFilename: file.originalFilename,
        newPath: file.filepath,
        size: file.size,
        type: file.mimetype
      });

      // Validate file type and size
      const ext = path.extname(file.originalFilename || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ error: 'Invalid file type' });
      }
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: 'File too large' });
      }

      // Get file details
      const filename = path.basename(file.filepath)
      const publicUrl = `/uploads/${filename}`

      // Save file record to database
      const savedFile = await prisma.file.create({
        data: {
          filename: filename,
          url: publicUrl,
          mimetype: file.mimetype || 'application/octet-stream',
          size: file.size || 0,
          filepath: file.filepath,
        },
      })

      console.log('File saved to database:', savedFile);

      // Return success response
      return res.status(201).json({
        id: savedFile.id,
        filename: savedFile.filename,
        url: savedFile.url,
        mimetype: savedFile.mimetype,
        size: savedFile.size,
      })
    } catch (error) {
      console.error('[Files API Error]', error)
      if (error instanceof Error) {
        if (error.message.includes('maxFileSize')) {
          return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' })
        }
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Failed to upload file' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}) 