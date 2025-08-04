'use client'

import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { Receipt, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Transaction {
  id: string
  orderNumber: string
  totalAmount: number
  pointsEarned: number
  pointsUsed: number
  transactionDate: string
  items: {
    productName: string
    quantity: number
  }[]
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <ThemedCard className="text-center py-8">
        <Receipt className="w-12 h-12 text-theme-text-disabled mx-auto mb-3" />
        <p className="text-theme-text-secondary">
          Henüz işlem bulunmuyor
        </p>
      </ThemedCard>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-theme-text-primary px-4">
        Son İşlemler
      </h2>
      
      <div className="space-y-2">
        {transactions.slice(0, 5).map((transaction) => (
          <ThemedCard key={transaction.id} noPadding>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-theme-text-primary">
                    #{transaction.orderNumber}
                  </p>
                  <p className="text-sm text-theme-text-secondary">
                    {format(new Date(transaction.transactionDate), 'd MMMM yyyy, HH:mm', { locale: tr })}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-theme-text-primary">
                    {transaction.totalAmount.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    })}
                  </p>
                </div>
              </div>

              {/* Points Info */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                {transaction.pointsEarned > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-theme-success" />
                    <span className="text-sm font-medium text-theme-success">
                      +{transaction.pointsEarned} puan
                    </span>
                  </div>
                )}
                
                {transaction.pointsUsed > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-theme-error" />
                    <span className="text-sm font-medium text-theme-error">
                      -{transaction.pointsUsed} puan
                    </span>
                  </div>
                )}
              </div>

              {/* Items Preview */}
              <div className="mt-2">
                <p className="text-xs text-theme-text-secondary">
                  {transaction.items.slice(0, 2).map(item => 
                    `${item.productName} (${item.quantity}x)`
                  ).join(', ')}
                  {transaction.items.length > 2 && ' ...'}
                </p>
              </div>
            </div>
          </ThemedCard>
        ))}
      </div>
    </div>
  )
}