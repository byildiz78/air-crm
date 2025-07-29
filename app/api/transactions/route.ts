import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const transactionItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  category: z.string().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  discountAmount: z.number().default(0),
  isFree: z.boolean().default(false),
  notes: z.string().optional()
})

const transactionSchema = z.object({
  customerId: z.string(),
  orderNumber: z.string(),
  totalAmount: z.number().min(0),
  discountAmount: z.number().default(0),
  finalAmount: z.number().min(0),
  pointsUsed: z.number().default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(transactionItemSchema),
  appliedCampaigns: z.array(z.object({
    campaignId: z.string(),
    discountAmount: z.number(),
    freeItems: z.array(z.string()).optional(),
    pointsEarned: z.number().default(0)
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {
      AND: [
        customerId ? { customerId } : {},
        startDate ? { transactionDate: { gte: new Date(startDate) } } : {},
        endDate ? { transactionDate: { lte: new Date(endDate) } } : {}
      ]
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { name: true, email: true, level: true }
          },
          items: true,
          appliedCampaigns: {
            include: {
              campaign: {
                select: { name: true, type: true }
              }
            }
          }
        },
        orderBy: { transactionDate: 'desc' }
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = transactionSchema.parse(body)

    // Calculate points earned (1 point per 10 TL spent)
    const pointsEarned = Math.floor(validatedData.finalAmount / 10)

    const transaction = await prisma.transaction.create({
      data: {
        orderNumber: validatedData.orderNumber,
        totalAmount: validatedData.totalAmount,
        discountAmount: validatedData.discountAmount,
        finalAmount: validatedData.finalAmount,
        pointsEarned,
        pointsUsed: validatedData.pointsUsed,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        customerId: validatedData.customerId,
        items: {
          create: validatedData.items
        },
        appliedCampaigns: validatedData.appliedCampaigns ? {
          create: validatedData.appliedCampaigns
        } : undefined
      },
      include: {
        customer: {
          select: { name: true, email: true }
        },
        items: true,
        appliedCampaigns: {
          include: {
            campaign: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Update customer points and last visit
    await prisma.customer.update({
      where: { id: validatedData.customerId },
      data: {
        points: {
          increment: pointsEarned - validatedData.pointsUsed
        },
        lastVisit: new Date()
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}