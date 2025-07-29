'use client'

import { useState } from 'react'
import { Campaign } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Play, Pause, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CampaignWithDetails extends Campaign {
  restaurant: { name: string }
  segments: { name: string }[]
  _count: { usages: number }
}

interface CampaignTableProps {
  campaigns: CampaignWithDetails[]
  onEdit: (campaign: CampaignWithDetails) => void
  onDelete: (campaign: CampaignWithDetails) => void
  onView: (campaign: CampaignWithDetails) => void
  onToggleStatus: (campaign: CampaignWithDetails) => void
}

const campaignTypeLabels = {
  DISCOUNT: 'İndirim',
  PRODUCT_BASED: 'Ürün Bazlı',
  LOYALTY_POINTS: 'Sadakat Puanı',
  TIME_BASED: 'Zaman Bazlı',
  BIRTHDAY_SPECIAL: 'Doğum Günü',
  COMBO_DEAL: 'Combo'
}

const discountTypeLabels = {
  PERCENTAGE: '%',
  FIXED_AMOUNT: '₺',
  FREE_ITEM: 'Ücretsiz',
  BUY_ONE_GET_ONE: '2 Al 1 Öde'
}

export function CampaignTable({ 
  campaigns, 
  onEdit, 
  onDelete, 
  onView, 
  onToggleStatus 
}: CampaignTableProps) {
  const getCampaignStatus = (campaign: CampaignWithDetails) => {
    const now = new Date()
    const start = new Date(campaign.startDate)
    const end = new Date(campaign.endDate)

    if (!campaign.isActive) {
      return { status: 'inactive', label: 'Pasif', color: 'bg-gray-100 text-gray-800' }
    }
    
    if (now < start) {
      return { status: 'scheduled', label: 'Planlandı', color: 'bg-blue-100 text-blue-800' }
    }
    
    if (now > end) {
      return { status: 'expired', label: 'Süresi Doldu', color: 'bg-red-100 text-red-800' }
    }
    
    return { status: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' }
  }

  const formatDiscountValue = (campaign: CampaignWithDetails) => {
    const symbol = discountTypeLabels[campaign.discountType as keyof typeof discountTypeLabels]
    if (campaign.discountType === 'PERCENTAGE') {
      return `${campaign.discountValue}${symbol}`
    }
    if (campaign.discountType === 'FIXED_AMOUNT') {
      return `${campaign.discountValue}${symbol}`
    }
    return symbol
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kampanya</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>İndirim</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Segmentler</TableHead>
            <TableHead>Kullanım</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign)
            
            return (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {campaign.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatDiscountValue(campaign)}
                  </div>
                  {campaign.minPurchase && (
                    <div className="text-xs text-gray-500">
                      Min: {campaign.minPurchase}₺
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {campaign.segments.length > 0 ? (
                      campaign.segments.slice(0, 2).map((segment, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {segment.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Tüm Müşteriler
                      </Badge>
                    )}
                    {campaign.segments.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{campaign.segments.length - 2} daha
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{campaign._count.usages}</span>
                  </div>
                  {campaign.maxUsage && (
                    <div className="text-xs text-gray-500">
                      / {campaign.maxUsage}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{format(new Date(campaign.startDate), 'dd MMM', { locale: tr })}</div>
                    <div className="text-gray-500">
                      {format(new Date(campaign.endDate), 'dd MMM', { locale: tr })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(campaign)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detaylar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(campaign)}>
                        {campaign.isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Duraklat
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Aktifleştir
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(campaign)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(campaign)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}