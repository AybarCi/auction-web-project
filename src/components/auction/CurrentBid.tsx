import { motion } from 'framer-motion'
import type { Bid } from '../../lib/types'

interface CurrentBidProps {
    highestBid: Bid | null
    minBidAmount: number
    bidCount: number
}

export default function CurrentBid({ highestBid, minBidAmount, bidCount }: CurrentBidProps) {
    const currentAmount = highestBid?.bid_amount || minBidAmount
    const displayName = highestBid?.bidder_name
        ? maskName(highestBid.bidder_name)
        : 'Henüz teklif yok'

    return (
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Mevcut En Yüksek Teklif</span>
                <span className="text-xs bg-secondary-500 text-white px-2 py-1 rounded-full">
                    {bidCount} teklif
                </span>
            </div>

            <motion.div
                key={currentAmount}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bid-pulse inline-block"
            >
                <span className="text-4xl sm:text-5xl font-bold gradient-text font-mono">
                    {formatCurrency(currentAmount)}
                </span>
            </motion.div>

            {highestBid && (
                <p className="mt-3 text-sm text-gray-500">
                    Teklif veren: <span className="font-medium text-gray-700">{displayName}</span>
                </p>
            )}

            <div className="mt-4 pt-4 border-t border-primary-100">
                <p className="text-xs text-gray-500">
                    Minimum artış: <span className="font-medium">+100 ₺</span>
                </p>
            </div>
        </div>
    )
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

function maskName(name: string): string {
    const parts = name.trim().split(' ')
    return parts.map(part => {
        if (part.length <= 2) return part[0] + '*'
        return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
    }).join(' ')
}
