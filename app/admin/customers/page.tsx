'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedCustomersView } from '@/components/admin/customers/enhanced-customers-view'
import { CustomerForm } from '@/components/admin/customers/customer-form'
import { Plus } from 'lucide-react'
import { Customer } from '@prisma/client'
import { toast } from 'sonner'

interface CustomerWithDetails extends Customer {
  restaurant: { name: string }
  tier?: {
    id: string
    name: string
    displayName: string
    color: string
    gradient: string | null
    icon: string | null
    level: number
    pointMultiplier: number
  }
  _count: { transactions: number }
}

interface CustomerStats {
  total: number
  newThisMonth: number
  activeCustomers: number
  averagePoints: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    newThisMonth: 0,
    activeCustomers: 0,
    averagePoints: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // Filters
  const [searchValue, setSearchValue] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue }),
        ...(levelFilter && { level: levelFilter })
      })

      const response = await fetch(`/api/customers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data.customers)
      setTotalPages(data.pagination.pages)
      
      // Calculate stats
      setStats({
        total: data.pagination.total,
        newThisMonth: data.customers.filter((c: Customer) => {
          const createdAt = new Date(c.createdAt)
          const now = new Date()
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear()
        }).length,
        activeCustomers: data.customers.filter((c: CustomerWithDetails) => 
          c._count.transactions > 0
        ).length,
        averagePoints: Math.round(
          data.customers.reduce((sum: number, c: Customer) => sum + c.points, 0) / 
          (data.customers.length || 1)
        )
      })
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Müşteriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, searchValue, levelFilter])

  const handleCreateCustomer = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, restaurantId: 'default-restaurant-id' })
      })

      if (!response.ok) throw new Error('Failed to create customer')
      
      toast.success('Müşteri başarıyla eklendi')
      setFormOpen(false)
      fetchCustomers()
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Müşteri eklenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCustomer = async (data: any) => {
    if (!editingCustomer) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update customer')
      
      toast.success('Müşteri başarıyla güncellendi')
      setFormOpen(false)
      setEditingCustomer(null)
      fetchCustomers()
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Müşteri güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCustomer = async (customer: CustomerWithDetails) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete customer')
      
      toast.success('Müşteri başarıyla silindi')
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Müşteri silinirken hata oluştu')
    }
  }

  const handleEdit = (customer: CustomerWithDetails) => {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleView = (customer: CustomerWithDetails) => {
    window.location.href = `/admin/customers/${customer.id}`
  }

  const handleSearch = (search: string) => {
    setSearchValue(search)
    setCurrentPage(1)
  }

  const handleLevelFilter = (level: string) => {
    setLevelFilter(level === 'ALL' ? '' : level)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchValue('')
    setLevelFilter('')
    setCurrentPage(1)
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteri Yönetimi</h1>
          <p className="text-gray-600">Müşterilerinizi yönetin ve takip edin</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Müşteri
        </Button>
      </div>

      {/* Enhanced Customers View */}
      <EnhancedCustomersView
        customers={customers}
        stats={stats}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteCustomer}
        onView={handleView}
        searchValue={searchValue}
        onSearchChange={handleSearch}
        levelFilter={levelFilter}
        onLevelFilterChange={handleLevelFilter}
        onClearFilters={handleClearFilters}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Customer Form Dialog */}
      <CustomerForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCustomer(null)
        }}
        customer={editingCustomer}
        onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
        isLoading={formLoading}
      />
    </div>
  )
}