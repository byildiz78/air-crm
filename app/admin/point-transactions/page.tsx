'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, Column } from '@/components/ui/data-table'
import { 
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Users,
  Star,
  Clock,
  Gift,
  ShoppingCart,
  Award,
  Download,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react'
import { PointHistory as PointHistoryModel, PointTransactionType } from '@prisma/client'
import { toast } from 'sonner'

interface PointHistoryWithDetails extends PointHistoryModel {
  customer: {
    name: string
    email: string
  }
}

interface PointTransactionStats {
  totalEarned: number
  totalSpent: number
  totalExpired: number
  netBalance: number
}

const typeLabels = {
  EARNED: 'Kazanılan',
  SPENT: 'Harcanan',
  EXPIRED: 'Süresi Dolmuş'
}

const typeColors = {
  EARNED: 'bg-green-100 text-green-800 border-green-200',
  SPENT: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
}

const sourceIcons: Record<string, any> = {
  PURCHASE: ShoppingCart,
  REWARD: Gift,
  BONUS: Award,
  MANUAL: Clock,
  CAMPAIGN: TrendingUp
}

const sourceLabels: Record<string, string> = {
  PURCHASE: 'Alışveriş',
  REWARD: 'Ödül',
  BONUS: 'Bonus',
  MANUAL: 'Manuel',
  CAMPAIGN: 'Kampanya'
}

export default function PointTransactionsPage() {
  const [pointHistory, setPointHistory] = useState<PointHistoryWithDetails[]>([])
  const [stats, setStats] = useState<PointTransactionStats>({
    totalEarned: 0,
    totalSpent: 0,
    totalExpired: 0,
    netBalance: 0
  })
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchPointHistory = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      
      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter)
      }
      
      if (startDate) {
        params.append('startDate', startDate)
      }
      
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/point-history/all?${params}`)
      if (!response.ok) throw new Error('Failed to fetch point history')
      
      const data = await response.json()
      setPointHistory(data.pointHistory)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching point history:', error)
      toast.error('Puan hareketleri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/point-history/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchPointHistory()
    fetchStats()
  }, [typeFilter, sourceFilter, startDate, endDate])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSourceIcon = (source: string) => {
    const IconComponent = sourceIcons[source] || Clock
    return IconComponent
  }

  const getSourceLabel = (source: string) => {
    return sourceLabels[source] || source
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchPointHistory(newPage)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Dışa aktarma özelliği yakında eklenecek')
  }

  // DataTable columns definition
  const columns: Column<PointHistoryWithDetails>[] = [
    {
      key: 'customer.name',
      header: 'Müşteri',
      sortable: true,
      searchable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{item.customer.name}</div>
          <div className="text-sm text-gray-500">{item.customer.email}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tür',
      sortable: true,
      render: (item) => (
        <Badge className={`text-xs border ${typeColors[item.type as keyof typeof typeColors]}`}>
          {typeLabels[item.type as keyof typeof typeLabels]}
        </Badge>
      )
    },
    {
      key: 'source',
      header: 'Kaynak',
      sortable: true,
      render: (item) => {
        const SourceIcon = getSourceIcon(item.source)
        return (
          <div className="flex items-center gap-2">
            <SourceIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm">{getSourceLabel(item.source)}</span>
          </div>
        )
      }
    },
    {
      key: 'amount',
      header: 'Miktar',
      sortable: true,
      className: 'text-right',
      render: (item) => {
        const isPositive = item.amount > 0
        return (
          <div className={`font-semibold flex items-center justify-end gap-1 ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {Math.abs(item.amount).toLocaleString()}
          </div>
        )
      }
    },
    {
      key: 'balance',
      header: 'Bakiye',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="font-medium text-gray-900">
          {item.balance.toLocaleString()}
        </div>
      )
    },
    {
      key: 'description',
      header: 'Açıklama',
      searchable: true,
      render: (item) => (
        <div className="max-w-xs truncate" title={item.description || ''}>
          {item.description || '-'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      sortable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="text-sm">{formatDate(item.createdAt.toString())}</div>
          {item.expiresAt && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(item.expiresAt.toString())}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Para Puan Hareketleri</h1>
          <p className="text-gray-600">Tüm müşterilerin puan kazanma ve harcama geçmişi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchPointHistory()
              fetchStats()
            }}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kazanılan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Puan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Harcanan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.abs(stats.totalSpent).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Puan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolmuş</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {Math.abs(stats.totalExpired).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Puan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Bakiye</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Puan</p>
          </CardContent>
        </Card>
      </div>


      {/* Point History DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Puan Hareketleri</CardTitle>
          <CardDescription>
            Toplam {pagination.total} kayıt bulundu - Kolon başlıklarına tıklayarak sıralayabilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={pointHistory}
            columns={columns}
            searchPlaceholder="Müşteri adı, e-posta veya açıklama ara..."
            loading={loading}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              pages: pagination.pages,
              onPageChange: handlePageChange
            }}
            actions={
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Dışa Aktar
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}