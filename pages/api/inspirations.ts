import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
} 