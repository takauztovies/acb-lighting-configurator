import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

export const config = {
  api: {
    bodyParser: false,
  },
}

const prisma = new PrismaClient()
const uploadDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const files = await prisma.file.findMany({
        orderBy: [{ id: 'desc' }],
      })
      return res.status(200).json(files)
    } catch (error) {
      console.error('Error fetching files:', error)
      return res.status(500).json({ error: 'Failed to fetch files' })
    }
  }

  if (req.method === 'POST') {
    try {
      // Create upload directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
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
          return `${basename}-${uniqueSuffix}${ext}`
        }
      })

      // Parse form data
      const [fields, files] = await new Promise<[formidable.Fields<string>, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err)
          else resolve([fields, files])
        })
      })

      // Get the uploaded file
      const fileField = files.file
      const file = Array.isArray(fileField) ? fileField[0] : fileField

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' })
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
          return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' })
        }
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Failed to upload file' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
} 