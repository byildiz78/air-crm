'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Target, Megaphone, TrendingUp, Activity, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface DashboardStats {
  totalCustomers: number
  customersThisMonth: number
  customerGrowth: number
  totalCampaigns: number
  activeCampaigns: number
  campaignsEndingToday: number
  totalSegments: number
  segmentsThisMonth: number
  totalTransactions: number
  transactionsThisMonth: number
  transactionGrowth: number
  todayRevenue: number
  thisMonthRevenue: number
  revenueGrowth: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface RevenueByDay {
  date: string
  revenue: number
  orderCount: number
}

interface SalesData {
  topProducts: TopProduct[]
  revenueByDay: RevenueByDay[]
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  color: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      
      const data = await response.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
      setSalesData(data.salesData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Dashboard verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statsCards = stats ? [
    {
      title: 'Bugünün Cirosu',
      value: `${stats.todayRevenue.toLocaleString()} ₺`,
      description: `Bu ay toplam ${stats.thisMonthRevenue.toLocaleString()} ₺`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Aylık Büyüme',
      value: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}%`,
      description: 'Ciro artışı (geçen aya göre)',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Toplam Müşteri',
      value: stats.totalCustomers.toLocaleString(),
      description: `Bu ay ${stats.customerGrowth >= 0 ? '+' : ''}${stats.customerGrowth}% artış`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Bu Ay İşlem',
      value: stats.transactionsThisMonth.toString(),
      description: `${stats.transactionGrowth >= 0 ? '+' : ''}${stats.transactionGrowth}% değişim`,
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ] : []

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Şimdi'
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`
    return format(date, 'dd MMM yyyy', { locale: tr })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Restoran CRM sisteminizin genel görünümü</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Son Aktiviteler
                </CardTitle>
                <CardDescription>
                  Sistemdeki son hareketler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {activity.description} - {formatTimeAgo(activity.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Henüz aktivite bulunmuyor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  En Çok Satan Ürünler
                </CardTitle>
                <CardDescription>
                  Bu ayki en popüler ürünler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData?.topProducts && salesData.topProducts.length > 0 ? (
                    salesData.topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.quantity} adet satıldı</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{product.revenue.toLocaleString()} ₺</p>
                          <p className="text-xs text-gray-500">toplam ciro</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Henüz satış verisi bulunmuyor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}