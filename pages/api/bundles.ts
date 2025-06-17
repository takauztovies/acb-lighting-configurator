import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        return res.status(204).end()
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: String(error) })
  }
} 