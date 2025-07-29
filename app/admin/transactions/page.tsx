'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionTable } from '@/components/admin/transactions/transaction-table'
import { TransactionForm } from '@/components/admin/transactions/transaction-form'
import { Plus, Receipt, TrendingUp, DollarSign, ShoppingCart, Search, Filter, Calendar } from 'lucide-react'
import { Transaction } from '@prisma/client'
import { toast } from 'sonner'

interface TransactionWithDetails extends Transaction {
  customer: { 
    name: string
    email: string
    level: string
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  appliedCampaigns: Array<{
    campaign: {
      name: string
      type: string
    }
    discountAmount: number
  }>
}

interface TransactionStats {
  totalTransactions: number
  totalRevenue: number
  averageOrderValue: number
  todayTransactions: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayTransactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  
  // Filters
  const [searchValue, setSearchValue] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue }),
        ...(dateFilter && { startDate: dateFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch transactions')
      
      const data = await response.json()
      setTransactions(data.transactions)
      
      // Calculate stats
      const today = new Date().toDateString()
      const todayTransactions = data.transactions.filter((t: TransactionWithDetails) => 
        new Date(t.transactionDate).toDateString() === today
      )
      
      const totalRevenue = data.transactions.reduce(
        (sum: number, t: TransactionWithDetails) => sum + t.finalAmount, 0
      )
      
      setStats({
        totalTransactions: data.pagination.total,
        totalRevenue,
        averageOrderValue: data.transactions.length > 0 ? totalRevenue / data.transactions.length : 0,
        todayTransactions: todayTransactions.length
      })
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Satış kayıtları yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, searchValue, dateFilter, statusFilter])

  const handleCreateTransaction = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create transaction')
      
      toast.success('Satış işlemi başarıyla kaydedildi')
      setFormOpen(false)
      fetchTransactions()
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Satış işlemi kaydedilirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleView = (transaction: TransactionWithDetails) => {
    // TODO: Implement transaction detail view
    console.log('View transaction:', transaction)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchTransactions()
  }

  const statsCards = [
    {
      title: 'Toplam İşlem',
      value: stats.totalTransactions.toString(),
      description: `${stats.todayTransactions} bugün`,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Toplam Ciro',
      value: `${stats.totalRevenue.toFixed(0)}₺`,
      description: 'Tüm satışlar',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Ortalama Sipariş',
      value: `${stats.averageOrderValue.toFixed(0)}₺`,
      description: 'İşlem başına',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Bugünkü Satış',
      value: stats.todayTransactions.toString(),
      description: 'Günlük işlem',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satış Kayıtları</h1>
          <p className="text-gray-600">Tüm satış işlemlerini görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Satış
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Sipariş numarası veya müşteri adı ile ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tümü</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="PENDING">Beklemede</SelectItem>
                <SelectItem value="CANCELLED">İptal</SelectItem>
                <SelectItem value="REFUNDED">İade</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">Ara</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Satış Listesi</CardTitle>
          <CardDescription>
            Tüm satış işlemlerini görüntüleyin ve detaylarını inceleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <TransactionTable
              transactions={transactions}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateTransaction}
        isLoading={formLoading}
      />
    </div>
  )
}