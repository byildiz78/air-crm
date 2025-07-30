import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  points: z.number().optional(),
  level: z.enum(['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        restaurant: {
          select: { name: true }
        },
        tier: {
          select: {
            id: true,
            name: true,
            displayName: true,
            color: true,
            gradient: true,
            icon: true,
            level: true,
            pointMultiplier: true,
            discountPercent: true,
            specialFeatures: true
          }
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
          include: {
            items: true,
            tier: {
              select: {
                displayName: true,
                pointMultiplier: true
              }
            }
          }
        },
        rewards: {
          where: {
            isRedeemed: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            reward: {
              select: {
                name: true,
                description: true,
                type: true,
                category: true,
                pointsCost: true,
                value: true
              }
            }
          }
        },
        segments: {
          include: {
            segment: {
              select: { name: true, description: true }
            }
          }
        },
        pointHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: { 
            transactions: true, 
            rewards: true,
            pointHistory: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get active campaigns available for this customer
    const now = new Date()
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        restaurantId: customer.restaurantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { segments: { none: {} } }, // Campaigns without segment restrictions
          { segments: { some: { id: { in: customer.segments.map(s => s.segmentId) } } } } // Campaigns for customer's segments
        ]
      },
      include: {
        _count: {
          select: { usages: true }
        },
        usages: {
          where: { customerId: customer.id }
        }
      }
    })

    // Filter campaigns based on usage limits
    const availableCampaigns = activeCampaigns.filter(campaign => {
      // Check max usage per customer
      if (campaign.maxUsagePerCustomer && campaign.usages.length >= campaign.maxUsagePerCustomer) {
        return false
      }
      // Check max total usage
      if (campaign.maxUsage && campaign._count.usages >= campaign.maxUsage) {
        return false
      }
      return true
    })

    // Calculate customer statistics
    const stats = {
      totalSpent: customer.totalSpent,
      totalVisits: customer.visitCount,
      averageSpent: customer.visitCount > 0 ? customer.totalSpent / customer.visitCount : 0,
      currentPoints: customer.points,
      totalPointsEarned: await prisma.pointHistory.aggregate({
        where: {
          customerId: customer.id,
          type: 'EARNED',
          amount: { gt: 0 }
        },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0),
      totalPointsSpent: await prisma.pointHistory.aggregate({
        where: {
          customerId: customer.id,
          type: 'SPENT',
          amount: { lt: 0 }
        },
        _sum: { amount: true }
      }).then(result => Math.abs(result._sum.amount || 0))
    }

    return NextResponse.json({ 
      customer,
      availableCampaigns,
      stats
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined
      },
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}