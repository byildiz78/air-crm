'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentTable } from '@/components/admin/segments/segment-table'
import { SegmentForm } from '@/components/admin/segments/segment-form'
import { CustomerSelector } from '@/components/admin/segments/customer-selector'
import { Plus, Target, Users, TrendingUp, Search } from 'lucide-react'
import { Segment } from '@prisma/client'
import { toast } from 'sonner'

interface SegmentWithDetails extends Segment {
  restaurant: { name: string }
  _count: { customers: number }
}

interface SegmentStats {
  total: number
  totalCustomers: number
  averageSize: number
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentWithDetails[]>([])
  const [stats, setStats] = useState<SegmentStats>({
    total: 0,
    totalCustomers: 0,
    averageSize: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<SegmentWithDetails | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchSegments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue })
      })

      const response = await fetch(`/api/segments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch segments')
      
      const data = await response.json()
      setSegments(data.segments)
      
      // Calculate stats
      const totalCustomers = data.segments.reduce(
        (sum: number, s: SegmentWithDetails) => sum + s._count.customers, 0
      )
      setStats({
        total: data.pagination.total,
        totalCustomers,
        averageSize: data.segments.length > 0 ? Math.round(totalCustomers / data.segments.length) : 0
      })
    } catch (error) {
      console.error('Error fetching segments:', error)
      toast.error('Segmentler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [currentPage, searchValue])

  const handleCreateSegment = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, restaurantId: 'default-restaurant-id' })
      })

      if (!response.ok) throw new Error('Failed to create segment')
      
      toast.success('Segment başarıyla oluşturuldu')
      setFormOpen(false)
      fetchSegments()
    } catch (error) {
      console.error('Error creating segment:', error)
      toast.error('Segment oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateSegment = async (data: any) => {
    if (!editingSegment) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/segments/${editingSegment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update segment')
      
      toast.success('Segment başarıyla güncellendi')
      setFormOpen(false)
      setEditingSegment(null)
      fetchSegments()
    } catch (error) {
      console.error('Error updating segment:', error)
      toast.error('Segment güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteSegment = async (segment: SegmentWithDetails) => {
    if (!confirm('Bu segmenti silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/segments/${segment.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete segment')
      
      toast.success('Segment başarıyla silindi')
      fetchSegments()
    } catch (error) {
      console.error('Error deleting segment:', error)
      toast.error('Segment silinirken hata oluştu')
    }
  }

  const handleEdit = (segment: SegmentWithDetails) => {
    setEditingSegment(segment)
    setFormOpen(true)
  }

  const handleView = (segment: SegmentWithDetails) => {
    // TODO: Implement segment detail view
    console.log('View segment:', segment)
  }

  const handleManageCustomers = (segment: SegmentWithDetails) => {
    setSelectedSegment(segment)
    setCustomerSelectorOpen(true)
  }

  const handleRefreshSegment = async (segment: SegmentWithDetails) => {
    if (!segment.isAutomatic) return

    try {
      const response = await fetch(`/api/segments/${segment.id}/refresh`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to refresh segment')
      
      const result = await response.json()
      toast.success(result.message)
      fetchSegments()
    } catch (error) {
      console.error('Error refreshing segment:', error)
      toast.error('Segment yenilenirken hata oluştu')
    }
  }
  const handleAddCustomers = async (customerIds: string[]) => {
    if (!selectedSegment) return

    try {
      const response = await fetch(`/api/segments/${selectedSegment.id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds })
      })

      if (!response.ok) throw new Error('Failed to add customers')
      
      const result = await response.json()
      toast.success(result.message)
      fetchSegments()
    } catch (error) {
      console.error('Error adding customers:', error)
      toast.error('Müşteriler eklenirken hata oluştu')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchSegments()
  }

  const statsCards = [
    {
      title: 'Toplam Segment',
      value: stats.total.toString(),
      description: 'Aktif segment sayısı',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Segmentli Müşteri',
      value: stats.totalCustomers.toString(),
      description: 'En az bir segmentte',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ortalama Boyut',
      value: stats.averageSize.toString(),
      description: 'Segment başına müşteri',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segment Yönetimi</h1>
          <p className="text-gray-600">Müşteri segmentlerini oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Segment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Segment adı veya açıklama ile ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Ara</Button>
          </form>
        </CardContent>
      </Card>

      {/* Segment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Listesi</CardTitle>
          <CardDescription>
            Tüm müşteri segmentlerini görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <SegmentTable
              segments={segments}
              onEdit={handleEdit}
              onDelete={handleDeleteSegment}
              onView={handleView}
              onManageCustomers={handleManageCustomers}
              onRefreshSegment={handleRefreshSegment}
            />
          )}
        </CardContent>
      </Card>

      {/* Segment Form Dialog */}
      <SegmentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingSegment(null)
        }}
        segment={editingSegment}
        onSubmit={editingSegment ? handleUpdateSegment : handleCreateSegment}
        isLoading={formLoading}
      />

      {/* Customer Selector Dialog */}
      <CustomerSelector
        open={customerSelectorOpen}
        onOpenChange={setCustomerSelectorOpen}
        segmentId={selectedSegment?.id || ''}
        onAddCustomers={handleAddCustomers}
        isLoading={formLoading}
      />
    </div>
  )
}