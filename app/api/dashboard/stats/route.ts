import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date info
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Fetch all statistics in parallel
    const [
      totalCustomers,
      customersThisMonth,
      customersLastMonth,
      totalCampaigns,
      activeCampaigns,
      campaignsEndingToday,
      totalSegments,
      segmentsThisMonth,
      recentTransactions,
      totalTransactions,
      transactionsThisMonth,
      transactionsLastMonth,
      todayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      topProducts,
      revenueByDay
    ] = await Promise.all([
      // Total customers
      prisma.customer.count(),
      
      // Customers this month
      prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Customers last month
      prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total campaigns
      prisma.campaign.count(),
      
      // Active campaigns
      prisma.campaign.count({
        where: {
          isActive: true,
          endDate: { gte: now }
        }
      }),
      
      // Campaigns ending today
      prisma.campaign.count({
        where: {
          isActive: true,
          endDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      }),
      
      // Total segments
      prisma.segment.count(),
      
      // Segments created this month
      prisma.segment.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Recent transactions for activity feed
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true }
          }
        }
      }),
      
      // Total transactions
      prisma.transaction.count(),
      
      // Transactions this month
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Transactions last month
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),

      // Today's revenue
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfToday,
            lt: endOfToday
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // This month's revenue
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfMonth
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Last month's revenue
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Top selling products this month
      prisma.transactionItem.groupBy({
        by: ['productName'],
        where: {
          transaction: {
            transactionDate: {
              gte: startOfMonth
            },
            status: 'COMPLETED'
          }
        },
        _sum: {
          quantity: true,
          totalPrice: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),

      // Revenue by day (last 7 days)
      prisma.transaction.groupBy({
        by: ['transactionDate'],
        where: {
          transactionDate: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          },
          status: 'COMPLETED'
        },
        _sum: {
          finalAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          transactionDate: 'asc'
        }
      })
    ])

    // Calculate growth percentages
    const customerGrowth = customersLastMonth > 0 
      ? Math.round(((customersThisMonth - customersLastMonth) / customersLastMonth) * 100)
      : customersThisMonth > 0 ? 100 : 0

    const transactionGrowth = transactionsLastMonth > 0
      ? Math.round(((transactionsThisMonth - transactionsLastMonth) / transactionsLastMonth) * 100)
      : transactionsThisMonth > 0 ? 100 : 0

    const revenueGrowth = (lastMonthRevenue._sum.finalAmount || 0) > 0
      ? Math.round((((thisMonthRevenue._sum.finalAmount || 0) - (lastMonthRevenue._sum.finalAmount || 0)) / (lastMonthRevenue._sum.finalAmount || 0)) * 100)
      : (thisMonthRevenue._sum.finalAmount || 0) > 0 ? 100 : 0

    return NextResponse.json({
      stats: {
        totalCustomers,
        customersThisMonth,
        customerGrowth,
        totalCampaigns,
        activeCampaigns,
        campaignsEndingToday,
        totalSegments,
        segmentsThisMonth,
        totalTransactions,
        transactionsThisMonth,
        transactionGrowth,
        todayRevenue: todayRevenue._sum.finalAmount || 0,
        thisMonthRevenue: thisMonthRevenue._sum.finalAmount || 0,
        revenueGrowth
      },
      recentActivity: recentTransactions.map(transaction => ({
        id: transaction.id,
        type: 'transaction',
        title: 'Yeni işlem',
        description: `${transaction.customer.name} - ${transaction.totalAmount.toLocaleString()} TL`,
        time: transaction.createdAt,
        color: 'bg-green-500'
      })),
      salesData: {
        topProducts: topProducts.map(product => ({
          name: product.productName,
          quantity: product._sum.quantity || 0,
          revenue: product._sum.totalPrice || 0
        })),
        revenueByDay: revenueByDay.map(day => ({
          date: day.transactionDate,
          revenue: day._sum.finalAmount || 0,
          orderCount: day._count.id || 0
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}