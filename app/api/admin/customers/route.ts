import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        // isActive field doesn't exist in schema, removing this filter
      },
      select: {
        id: true,
        name: true,
        phone: true,
        points: true,
        level: true,
        createdAt: true,
        tier: {
          select: {
            name: true
          }
        },
        segments: {
          select: {
            segment: {
              select: {
                name: true
              }
            }
          }
        },
        pushSubscriptions: {
          where: {
            isActive: true
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Only return customers who have active push subscriptions
    const customersWithPush = customers.filter(customer => 
      customer.pushSubscriptions.length > 0
    ).map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      loyaltyTier: customer.tier?.name || customer.level || 'Bronze',
      segment: customer.segments.length > 0 ? customer.segments[0].segment.name : 'Regular',
      totalPoints: customer.points,
      createdAt: customer.createdAt
    }))

    return NextResponse.json(customersWithPush)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Müşteriler alınamadı' }, { status: 500 })
  }
}