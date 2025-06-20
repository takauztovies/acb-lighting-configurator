import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
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

export default withCorsAndSecurityHeaders(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only require admin authentication for write operations
  if (req.method !== 'GET' && !verifyAdmin(req, res)) return
  try {
    switch (req.method) {
      case 'GET': {
        const inspirations = await prisma.inspiration.findMany({
          orderBy: {
            sortOrder: 'asc'
          }
        })
        return res.status(200).json(inspirations)
      }
      case 'POST': {
        const { title, description, image, category, tags, isActive, sortOrder, displaySize } = req.body
        const inspiration = await prisma.inspiration.create({
          data: {
            title,
            description,
            image,
            category,
            tags,
            isActive,
            sortOrder,
            displaySize
          }
        })
        return res.status(201).json(inspiration)
      }
      case 'PUT': {
        const { id } = req.query
        const { title, description, image, category, tags, isActive, sortOrder, displaySize } = req.body
        const inspiration = await prisma.inspiration.update({
          where: { id: id as string },
          data: {
            title,
            description,
            image,
            category,
            tags,
            isActive,
            sortOrder,
            displaySize
          }
        })
        return res.status(200).json(inspiration)
      }
      case 'DELETE': {
        const { id } = req.query
        await prisma.inspiration.delete({
          where: { id: id as string }
        })
        return res.status(204).end()
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Inspiration API Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}) 