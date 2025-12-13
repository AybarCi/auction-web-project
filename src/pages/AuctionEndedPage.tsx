import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Auction, Bid } from '../lib/types'
import Button from '../components/ui/Button'

export default function AuctionEndedPage() {
    const [auction, setAuction] = useState<Auction | null>(null)
    const [winner, setWinner] = useState<Bid | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchEndedAuction = async () => {
            try {
                // Get the most recent ended auction
                const { data: auctions } = await supabase
                    .from('auctions')
                    .select('*')
                    .or('is_active.eq.false,end_time.lt.now()')
                    .order('end_time', { ascending: false })
                    .limit(1)

                if (auctions && auctions.length > 0) {
                    const endedAuction = auctions[0] as Auction
                    setAuction(endedAuction)

                    // Get the winning bid
                    const { data: bids } = await supabase
                        .from('bids')
                        .select('*')
                        .eq('auction_id', endedAuction.id)
                        .order('bid_amount', { ascending: false })
                        .limit(1)

                    if (bids && bids.length > 0) {
                        setWinner(bids[0] as Bid)
                    }
                }
            } catch (error) {
                console.error('Error fetching auction:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchEndedAuction()
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full"
            >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-8 text-center text-white">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Açık Artırma Sona Erdi</h1>
                        <p className="text-white/80">Katılımınız için teşekkür ederiz!</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {auction && (
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{auction.title}</h2>
                            </div>
                        )}

                        {winner ? (
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6 border border-yellow-100">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <span className="text-2xl">🏆</span>
                                    <h3 className="text-lg font-bold text-gray-900">Kazanan</h3>
                                </div>

                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 mb-2">
                                        {maskName(winner.bidder_name)}
                                    </p>
                                    <p className="text-3xl font-bold gradient-text font-mono">
                                        {formatCurrency(winner.bid_amount)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-gray-600">Bu açık artırmaya teklif verilmedi.</p>
                            </div>
                        )}

                        {/* Thank you message */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Bağışlarınız İçin Teşekkürler!</h3>
                            <p className="text-gray-600 text-sm">
                                Toplanan tüm gelirler SMA hastası çocuğumuzun tedavisi için kullanılacaktır.
                                Desteğiniz hayatları değiştiriyor.
                            </p>
                        </div>

                        {/* Bank info (placeholder) */}
                        <div className="border border-gray-200 rounded-xl p-4 mb-6">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Ödeme Bilgileri
                            </h4>
                            <p className="text-sm text-gray-600">
                                Kazananlarla ayrıca iletişime geçilecektir.
                            </p>
                        </div>

                        <Link to="/">
                            <Button variant="outline" className="w-full">
                                Ana Sayfaya Dön
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
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
