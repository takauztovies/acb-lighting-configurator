import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET': {
      const components = await prisma.component.findMany({ include: { snapPoints: true } })
      return res.status(200).json(components)
    }
    case 'POST': {
      const { name, type, description, model3dUrl, imageUrl, metadata } = req.body
      const component = await prisma.component.create({
        data: { name, type, description, model3dUrl, imageUrl, metadata }
      })
      return res.status(201).json(component)
    }
    case 'PUT': {
      const { id, ...data } = req.body
      const component = await prisma.component.update({ where: { id }, data })
      return res.status(200).json(component)
    }
    case 'DELETE': {
      const { id } = req.body
      await prisma.component.delete({ where: { id } })
      return res.status(204).end()
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 