'use client'

import { Gift, Star, Award } from 'lucide-react'
import { useTheme } from '@/lib/mobile/theme-context'

interface StampData {
  campaignId: string
  campaignName: string
  buyQuantity: number
  totalPurchased: number
  stampsEarned: number
  stampsUsed: number
  stampsAvailable: number
  progressToNext: number
  remainingForNextStamp: number
  discountValue: number
  discountType: string
  maxUsage: number
  canEarnMore: boolean
}

interface StampCardProps {
  stamp: StampData
}

export function StampCard({ stamp }: StampCardProps) {
  const { theme } = useTheme()

  const renderProgressBar = () => {
    const progress = (stamp.progressToNext / stamp.buyQuantity) * 100
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${theme.primary.gradient} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    )
  }

  const renderStampDots = () => {
    const dots = []
    const maxDisplay = 10 // Maximum stamps to display
    const displayCount = Math.min(stamp.stampsEarned, maxDisplay)
    
    for (let i = 0; i < displayCount; i++) {
      dots.push(
        <div
          key={`stamp-${i}`}
          className={`w-4 h-4 rounded-full flex items-center justify-center ${
            i < stamp.stampsUsed 
              ? 'bg-gray-200 text-gray-400' // Used stamps
              : `bg-gradient-to-br ${theme.primary.gradient} text-white` // Available stamps
          }`}
        >
          <Star className="w-2 h-2" fill="currentColor" />
        </div>
      )
    }
    
    if (stamp.stampsEarned > maxDisplay) {
      dots.push(
        <span key="more" className="text-xs text-gray-500 font-medium ml-1">
          +{stamp.stampsEarned - maxDisplay}
        </span>
      )
    }
    
    return dots
  }

  const getRewardText = () => {
    if (stamp.discountType === 'PERCENTAGE') {
      return `%${stamp.discountValue} İndirim`
    } else if (stamp.discountType === 'FIXED_AMOUNT') {
      return `${stamp.discountValue}₺ İndirim`
    } else if (stamp.discountType === 'FREE_ITEM') {
      return 'Bedava Ürün'
    }
    return 'Ödül'
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.primary.gradient} flex items-center justify-center`}>
            <Gift className="w-3 h-3 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{stamp.campaignName}</h3>
            <p className="text-xs text-gray-600">
              {stamp.buyQuantity} al → {getRewardText()}
            </p>
          </div>
        </div>
        
        {stamp.stampsAvailable > 0 && (
          <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${theme.primary.gradient} text-white text-xs font-bold`}>
            {stamp.stampsAvailable} Hazır
          </div>
        )}
      </div>

      {/* Compact Progress */}
      <div className="space-y-3">
        {/* Current Status - Horizontal */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-600">Alışveriş</p>
            <p className="text-lg font-bold text-gray-900">{stamp.totalPurchased}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Damga</p>
            <p className="text-lg font-bold text-gray-900">{stamp.stampsEarned}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Kullanılan</p>
            <p className="text-lg font-bold text-gray-900">{stamp.stampsUsed}</p>
          </div>
        </div>

        {/* Stamps Display - Compact */}
        {stamp.stampsEarned > 0 && (
          <div className="flex items-center gap-1">
            {renderStampDots()}
          </div>
        )}

        {/* Progress Bar */}
        {stamp.canEarnMore && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">
                Sonraki damgaya {stamp.remainingForNextStamp} kaldı
              </span>
              <span className="text-xs font-medium text-gray-900">
                {stamp.progressToNext}/{stamp.buyQuantity}
              </span>
            </div>
            {renderProgressBar()}
          </div>
        )}

        {/* Max usage */}
        {!stamp.canEarnMore && stamp.stampsEarned >= stamp.maxUsage && (
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium">
              Maksimum kullanım tamamlandı
            </p>
          </div>
        )}
      </div>
    </div>
  )
}