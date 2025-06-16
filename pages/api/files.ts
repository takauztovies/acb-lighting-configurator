import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm, type Fields, type Files, type File } from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

// PrismaClient singleton pattern for Next.js
// import type { PrismaClient as PrismaClientType } from '@prisma/client'
let PrismaClient: any, prisma: any
if (process.env.NODE_ENV === 'production') {
  PrismaClient = require('@prisma/client').PrismaClient
  prisma = new PrismaClient()
} else {
  if (!(global as any).prisma) {
    PrismaClient = require('@prisma/client').PrismaClient
    ;(global as any).prisma = new PrismaClient()
  }
  prisma = (global as any).prisma
}

const uploadDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const form = new IncomingForm({ uploadDir, keepExtensions: true })
      form.parse(req, async (err: any, fields: Fields, files: Files) => {
        if (err) {
          console.error('[File Upload Error]', err)
          res.status(500).json({ error: 'File upload error', details: process.env.NODE_ENV === 'development' ? String(err) : undefined })
          return
        }
        let file = files.file as File | File[] | undefined;
        if (Array.isArray(file)) file = file[0];
        if (!file) {
          console.warn('[File Upload] No file uploaded', { fields, files })
          res.status(400).json({ error: 'No file uploaded' })
          return
        }
        try {
          const fileData = await prisma.file.create({
            data: {
              filename: file.originalFilename || file.newFilename,
              mimetype: file.mimetype || '',
              url: `/uploads/${path.basename(file.filepath)}`,
              size: file.size,
            },
          })
          res.status(201).json(fileData)
        } catch (prismaErr) {
          console.error('[Prisma File Create Error]', prismaErr)
          res.status(500).json({ error: 'Database error', details: process.env.NODE_ENV === 'development' ? String(prismaErr) : undefined })
        }
      })
      return // Ensure no further code runs after async parse
    } else if (req.method === 'GET') {
      try {
        const files = await prisma.file.findMany()
        res.status(200).json(files)
      } catch (prismaErr) {
        console.error('[Prisma File FindMany Error]', prismaErr)
        res.status(500).json({ error: 'Database error', details: process.env.NODE_ENV === 'development' ? String(prismaErr) : undefined })
      }
      return
    } else {
      res.setHeader('Allow', ['POST', 'GET'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
      return
    }
  } catch (unexpectedErr) {
    console.error('[Unexpected /api/files Error]', unexpectedErr)
    res.status(500).json({ error: 'Unexpected server error', details: process.env.NODE_ENV === 'development' ? String(unexpectedErr) : undefined })
    return
  }
} 