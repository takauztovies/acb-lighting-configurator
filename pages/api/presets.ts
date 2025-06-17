import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const presets = await prisma.preset.findMany()
        return res.status(200).json(presets)
      }
      case 'POST': {
        const { name, description, components } = req.body
        const preset = await prisma.preset.create({
          data: {
            name,
            description,
            components: components || []
          }
        })
        return res.status(201).json(preset)
      }
      case 'PUT': {
        const { id } = req.query
        const { name, description, components } = req.body
        const preset = await prisma.preset.update({
          where: { id: id as string },
          data: {
            name,
            description,
            components: components || []
          }
        })
        return res.status(200).json(preset)
      }
      case 'DELETE': {
        const { id } = req.query
        await prisma.preset.delete({
          where: { id: id as string }
        })
        return res.status(204).end()
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Presets API Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
} 