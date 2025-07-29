'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Target, Megaphone, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: 'Toplam Müşteri',
    value: '1,234',
    description: 'Bu ay +12%',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Aktif Kampanya',
    value: '8',
    description: '3 tanesi bugün bitiyor',
    icon: Megaphone,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    title: 'Segment Sayısı',
    value: '12',
    description: '2 yeni segment',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    title: 'Aylık Büyüme',
    value: '%23',
    description: 'Geçen aya göre',
    icon: TrendingUp,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Restoran CRM sisteminizin genel görünümü</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>
              Sistemdeki son hareketler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Yeni müşteri kaydı</p>
                  <p className="text-xs text-gray-500">Ahmet Yılmaz - 2 dakika önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Kampanya başlatıldı</p>
                  <p className="text-xs text-gray-500">Yaz İndirimi - 1 saat önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Segment güncellendi</p>
                  <p className="text-xs text-gray-500">VIP Müşteriler - 3 saat önce</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
            <CardDescription>
              Sık kullanılan işlemler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium text-sm">Yeni Müşteri</p>
                <p className="text-xs text-gray-500">Müşteri ekle</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <Megaphone className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium text-sm">Kampanya</p>
                <p className="text-xs text-gray-500">Yeni kampanya</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <Target className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium text-sm">Segment</p>
                <p className="text-xs text-gray-500">Segment oluştur</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <TrendingUp className="h-6 w-6 text-amber-600 mb-2" />
                <p className="font-medium text-sm">Rapor</p>
                <p className="text-xs text-gray-500">Analiz görüntüle</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}