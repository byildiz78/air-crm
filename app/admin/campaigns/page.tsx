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
import { CampaignTable } from '@/components/admin/campaigns/campaign-table'
import { CampaignForm } from '@/components/admin/campaigns/campaign-form'
import { Plus, Megaphone, TrendingUp, Users, BarChart3, Search, Filter } from 'lucide-react'
import { Campaign } from '@prisma/client'
import { toast } from 'sonner'

interface CampaignWithDetails extends Campaign {
  restaurant: { name: string }
  segments: { name: string }[]
  _count: { usages: number }
}

interface CampaignStats {
  total: number
  active: number
  totalUsages: number
  averageUsage: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([])
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    totalUsages: 0,
    averageUsage: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // Filters
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue }),
        ...(typeFilter && typeFilter !== 'ALL' && { type: typeFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/campaigns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      
      const data = await response.json()
      setCampaigns(data.campaigns)
      
      // Calculate stats
      const now = new Date()
      const activeCampaigns = data.campaigns.filter((c: CampaignWithDetails) => 
        c.isActive && 
        new Date(c.startDate) <= now && 
        new Date(c.endDate) >= now
      )
      
      const totalUsages = data.campaigns.reduce(
        (sum: number, c: CampaignWithDetails) => sum + c._count.usages, 0
      )
      
      setStats({
        total: data.pagination.total,
        active: activeCampaigns.length,
        totalUsages,
        averageUsage: data.campaigns.length > 0 ? Math.round(totalUsages / data.campaigns.length) : 0
      })
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Kampanyalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [currentPage, searchValue, typeFilter, statusFilter])

  const handleCreateCampaign = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create campaign')
      
      toast.success('Kampanya başarıyla oluşturuldu')
      setFormOpen(false)
      fetchCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Kampanya oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCampaign = async (data: any) => {
    if (!editingCampaign) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update campaign')
      
      toast.success('Kampanya başarıyla güncellendi')
      setFormOpen(false)
      setEditingCampaign(null)
      fetchCampaigns()
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast.error('Kampanya güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCampaign = async (campaign: CampaignWithDetails) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete campaign')
      
      toast.success('Kampanya başarıyla silindi')
      fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Kampanya silinirken hata oluştu')
    }
  }

  const handleToggleStatus = async (campaign: CampaignWithDetails) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !campaign.isActive })
      })

      if (!response.ok) throw new Error('Failed to toggle campaign status')
      
      toast.success(`Kampanya ${!campaign.isActive ? 'aktifleştirildi' : 'duraklatıldı'}`)
      fetchCampaigns()
    } catch (error) {
      console.error('Error toggling campaign status:', error)
      toast.error('Kampanya durumu değiştirilirken hata oluştu')
    }
  }

  const handleEdit = (campaign: CampaignWithDetails) => {
    setEditingCampaign(campaign)
    setFormOpen(true)
  }

  const handleView = (campaign: CampaignWithDetails) => {
    // TODO: Implement campaign detail view
    console.log('View campaign:', campaign)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCampaigns()
  }

  const statsCards = [
    {
      title: 'Toplam Kampanya',
      value: stats.total.toString(),
      description: `${stats.active} aktif kampanya`,
      icon: Megaphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Aktif Kampanya',
      value: stats.active.toString(),
      description: 'Şu anda çalışan',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Toplam Kullanım',
      value: stats.totalUsages.toString(),
      description: 'Tüm kampanyalar',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Ortalama Kullanım',
      value: stats.averageUsage.toString(),
      description: 'Kampanya başına',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampanya Yönetimi</h1>
          <p className="text-gray-600">Müşterilerinize özel kampanyalar oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kampanya
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
                placeholder="Kampanya adı veya açıklama ile ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tür filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm Türler</SelectItem>
                <SelectItem value="DISCOUNT">İndirim</SelectItem>
                <SelectItem value="PRODUCT_BASED">Ürün Bazlı</SelectItem>
                <SelectItem value="LOYALTY_POINTS">Sadakat Puanı</SelectItem>
                <SelectItem value="TIME_BASED">Zaman Bazlı</SelectItem>
                <SelectItem value="BIRTHDAY_SPECIAL">Doğum Günü</SelectItem>
                <SelectItem value="COMBO_DEAL">Combo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">Ara</Button>
          </form>
        </CardContent>
      </Card>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kampanya Listesi</CardTitle>
          <CardDescription>
            Tüm kampanyalarınızı görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <CampaignTable
              campaigns={campaigns}
              onEdit={handleEdit}
              onDelete={handleDeleteCampaign}
              onView={handleView}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </CardContent>
      </Card>

      {/* Campaign Form Dialog */}
      <CampaignForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCampaign(null)
        }}
        campaign={editingCampaign}
        onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
        isLoading={formLoading}
      />
    </div>
  )
}