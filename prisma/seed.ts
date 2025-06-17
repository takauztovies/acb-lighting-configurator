import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create some initial components
  const track = await prisma.component.create({
    data: {
      name: 'Basic Track',
      type: 'track',
      description: 'Standard lighting track',
      price: 29.99,
      imageUrl: '/placeholder.svg',
      cardImageUrl: '/placeholder.svg',
      metadata: {
        length: '1m',
        color: 'black',
        material: 'aluminum'
      },
      snapPoints: {
        create: [
          {
            name: 'start',
            type: 'track-connection',
            position: JSON.stringify([0, 0, 0]),
            rotation: JSON.stringify([0, 0, 0])
          },
          {
            name: 'end',
            type: 'track-connection',
            position: JSON.stringify([100, 0, 0]),
            rotation: JSON.stringify([0, 0, 0])
          }
        ]
      }
    }
  })

  const spotlight = await prisma.component.create({
    data: {
      name: 'LED Spotlight',
      type: 'spotlight',
      description: 'Adjustable LED spotlight',
      price: 49.99,
      imageUrl: '/placeholder.svg',
      cardImageUrl: '/placeholder.svg',
      metadata: {
        wattage: '7W',
        color_temperature: '3000K',
        beam_angle: '36°'
      },
      snapPoints: {
        create: [
          {
            name: 'mount',
            type: 'track-mount',
            position: JSON.stringify([0, 0, 0]),
            rotation: JSON.stringify([0, 0, 0])
          }
        ]
      }
    }
  })

  // Create a bundle
  await prisma.bundle.create({
    data: {
      name: 'Basic Track Lighting Kit',
      description: 'A starter kit with track and spotlight',
      price: 69.99,
      components: {
        connect: [
          { id: track.id },
          { id: spotlight.id }
        ]
      }
    }
  })

  // Create a preset
  await prisma.preset.create({
    data: {
      name: 'Simple Track Setup',
      description: 'Basic track with one spotlight',
      components: [
        {
          id: track.id,
          position: [0, 200, 0],
          rotation: [0, 0, 0],
          connections: []
        },
        {
          id: spotlight.id,
          position: [50, 200, 0],
          rotation: [0, 0, 0],
          connections: [track.id]
        }
      ]
    }
  })

  // Create an inspiration
  await prisma.inspiration.create({
    data: {
      title: 'Modern Living Room',
      description: 'Track lighting setup for a modern living room',
      image: '/placeholder.jpg',
      category: 'living-room',
      tags: ['modern', 'track-lighting', 'spotlight'],
      isActive: true,
      sortOrder: 1,
      displaySize: 'medium',
      components: [
        {
          id: track.id,
          position: [0, 200, 0],
          rotation: [0, 0, 0]
        },
        {
          id: spotlight.id,
          position: [50, 200, 0],
          rotation: [0, -45, 0]
        }
      ]
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 