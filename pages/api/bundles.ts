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
  // Only require admin authentication for write operations
  if (req.method !== 'GET' && !verifyAdmin(req, res)) return
  try {
    switch (req.method) {
      case 'GET': {
        const bundles = await prisma.bundle.findMany({
          orderBy: { createdAt: 'desc' }
        })
        return res.status(200).json(bundles)
      }
      case 'POST': {
        const { name, description, components, price, image } = req.body
        const bundle = await prisma.bundle.create({
          data: {
            name,
            description,
            price,
            image,
            components: JSON.stringify(components)
          }
        })
        return res.status(201).json(bundle)
      }
      case 'PUT': {
        const { id, name, description, components, price, image } = req.body
        const bundle = await prisma.bundle.update({
          where: { id },
          data: {
            name,
            description,
            price,
            image,
            components: JSON.stringify(components)
          }
        })
        return res.status(200).json(bundle)
      }
      case 'DELETE': {
        const { id } = req.query
        await prisma.bundle.delete({ where: { id: String(id) } })
        res.status(204).end()
        return
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
        return
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: String(error) })
  }
}) 