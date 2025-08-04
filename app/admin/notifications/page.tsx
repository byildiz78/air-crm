'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Plus, Send, Users, Eye, Calendar, MessageSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface NotificationLog {
  id: string
  title: string
  body: string
  type: 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL'
  targetCustomerIds: string
  sentCount: number
  failedCount: number
  createdAt: string
}

interface Customer {
  id: string
  name: string
  phone: string
  loyaltyTier: string
  segment: string
  totalPoints: number
}

interface NotificationFilters {
  targetType: 'all' | 'segment' | 'tier' | 'custom'
  segments: string[]
  tiers: string[]
  customCustomers: string[]
}

interface NotificationForm {
  title: string
  body: string
  type: 'CAMPAIGN' | 'REWARD' | 'POINTS' | 'GENERAL'
  filters: NotificationFilters
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationLog | null>(null)
  
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    type: 'GENERAL',
    filters: {
      targetType: 'all',
      segments: [],
      tiers: [],
      customCustomers: []
    }
  })

  // Available segments and tiers
  const availableSegments = ['Premium', 'Regular', 'New', 'VIP']
  const availableTiers = ['REGULAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

  useEffect(() => {
    loadNotifications()
    loadCustomers()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Bildirimler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const getFilteredCustomers = (): Customer[] => {
    const { targetType, segments, tiers, customCustomers } = form.filters

    if (targetType === 'all') {
      return customers
    }

    return customers.filter(customer => {
      if (targetType === 'segment' && segments.length > 0) {
        return segments.includes(customer.segment)
      }
      
      if (targetType === 'tier' && tiers.length > 0) {
        return tiers.includes(customer.loyaltyTier)
      }
      
      if (targetType === 'custom' && customCustomers.length > 0) {
        return customCustomers.includes(customer.id)
      }
      
      return false
    })
  }

  const handleSendNotification = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Başlık ve mesaj gerekli')
      return
    }

    const targetCustomers = getFilteredCustomers()
    if (targetCustomers.length === 0) {
      toast.error('Hedef müşteri seçmelisiniz')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          type: form.type,
          targetCustomerIds: targetCustomers.map(c => c.id)
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Bildirim gönderildi! ${result.sentCount} başarılı, ${result.failedCount} başarısız`)
        setShowCreateDialog(false)
        setForm({
          title: '',
          body: '',
          type: 'GENERAL',
          filters: {
            targetType: 'all',
            segments: [],
            tiers: [],
            customCustomers: []
          }
        })
        loadNotifications()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Bildirim gönderilemedi')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Bildirim gönderilirken hata oluştu')
    } finally {
      setSending(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CAMPAIGN': return 'bg-blue-100 text-blue-800'
      case 'REWARD': return 'bg-green-100 text-green-800'
      case 'POINTS': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CAMPAIGN': return 'Kampanya'
      case 'REWARD': return 'Ödül'
      case 'POINTS': return 'Puan'
      default: return 'Genel'
    }
  }

  return (
    <div className="admin-app p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Bildirim Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Müşterilerinize push bildirim gönderin ve geçmişi görüntüleyin
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Bildirim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Bildirim Gönder</DialogTitle>
              <DialogDescription>
                Müşterilerinize push bildirim gönderin
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Bildirim İçeriği */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık *</Label>
                  <Input
                    id="title"
                    placeholder="Bildirim başlığı"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Mesaj *</Label>
                  <Textarea
                    id="body"
                    placeholder="Bildirim mesajı"
                    value={form.body}
                    onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Bildirim Türü</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: any) => setForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">Genel</SelectItem>
                      <SelectItem value="CAMPAIGN">Kampanya</SelectItem>
                      <SelectItem value="REWARD">Ödül</SelectItem>
                      <SelectItem value="POINTS">Puan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hedef Seçimi */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Hedef Müşteriler</h4>
                
                <div className="space-y-2">
                  <Label>Hedef Türü</Label>
                  <Select
                    value={form.filters.targetType}
                    onValueChange={(value: any) => setForm(prev => ({
                      ...prev,
                      filters: { ...prev.filters, targetType: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Müşteriler</SelectItem>
                      <SelectItem value="segment">Segmentlere Göre</SelectItem>
                      <SelectItem value="tier">Seviyelere Göre</SelectItem>
                      <SelectItem value="custom">Manuel Seçim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Segment Seçimi */}
                {form.filters.targetType === 'segment' && (
                  <div className="space-y-2">
                    <Label>Segmentler</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSegments.map(segment => (
                        <div key={segment} className="flex items-center space-x-2">
                          <Checkbox
                            id={`segment-${segment}`}
                            checked={form.filters.segments.includes(segment)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setForm(prev => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    segments: [...prev.filters.segments, segment]
                                  }
                                }))
                              } else {
                                setForm(prev => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    segments: prev.filters.segments.filter(s => s !== segment)
                                  }
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`segment-${segment}`}>{segment}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier Seçimi */}
                {form.filters.targetType === 'tier' && (
                  <div className="space-y-2">
                    <Label>Sadakat Seviyeleri</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTiers.map(tier => (
                        <div key={tier} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tier-${tier}`}
                            checked={form.filters.tiers.includes(tier)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setForm(prev => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    tiers: [...prev.filters.tiers, tier]
                                  }
                                }))
                              } else {
                                setForm(prev => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    tiers: prev.filters.tiers.filter(t => t !== tier)
                                  }
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`tier-${tier}`}>
                            {tier === 'REGULAR' ? 'Regular' : 
                             tier === 'BRONZE' ? 'Bronze' : 
                             tier === 'SILVER' ? 'Silver' : 
                             tier === 'GOLD' ? 'Gold' : 
                             tier === 'PLATINUM' ? 'Platinum' : tier}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hedef Sayısı */}
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">
                      Hedef Müşteri Sayısı: {getFilteredCustomers().length}
                    </span>
                  </div>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Toplam müşteri: {customers.length}</div>
                      <div>İlk müşteri tier: {customers[0]?.loyaltyTier}</div>
                      <div>İlk müşteri segment: {customers[0]?.segment}</div>
                      <div>Seçili targetType: {form.filters.targetType}</div>
                      <div>Seçili tiers: {JSON.stringify(form.filters.tiers)}</div>
                      <div>Seçili segments: {JSON.stringify(form.filters.segments)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={sending}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleSendNotification}
                  disabled={sending || !form.title.trim() || !form.body.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Gönderiliyor...' : 'Gönder'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Bildirim</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Başarılı Gönderim</p>
                <p className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + n.sentCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktif Müşteri</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bu Ay</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => 
                    new Date(n.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bildirim Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Geçmişi</CardTitle>
          <CardDescription>
            Gönderilen tüm bildirimleri görüntüleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Henüz bildirim yok</h3>
              <p className="text-muted-foreground">İlk bildiriminizi gönderin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge className={getTypeColor(notification.type)}>
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                        <span>✅ {notification.sentCount} başarılı</span>
                        {notification.failedCount > 0 && (
                          <span>❌ {notification.failedCount} başarısız</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detay Dialog */}
      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bildirim Detayları</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Başlık</Label>
                <p className="font-medium">{selectedNotification.title}</p>
              </div>
              
              <div>
                <Label>Mesaj</Label>
                <p className="text-sm">{selectedNotification.body}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tür</Label>
                  <Badge className={getTypeColor(selectedNotification.type)}>
                    {getTypeLabel(selectedNotification.type)}
                  </Badge>
                </div>
                <div>
                  <Label>Gönderim Tarihi</Label>
                  <p className="text-sm">
                    {format(new Date(selectedNotification.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Başarılı Gönderim</Label>
                  <p className="text-green-600 font-medium">{selectedNotification.sentCount}</p>
                </div>
                <div>
                  <Label>Başarısız Gönderim</Label>
                  <p className="text-red-600 font-medium">{selectedNotification.failedCount}</p>
                </div>
              </div>
              
              <div>
                <Label>Hedef Müşteri Sayısı</Label>
                <p className="font-medium">
                  {JSON.parse(selectedNotification.targetCustomerIds).length} müşteri
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}