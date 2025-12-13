import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { Auction, Bid } from '../../lib/types'
import Button from '../../components/ui/Button'

interface Stats {
    totalAuctions: number
    activeAuctions: number
    totalBids: number
    totalAmount: number
}

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<Stats>({ totalAuctions: 0, activeAuctions: 0, totalBids: 0, totalAmount: 0 })
    const [recentBids, setRecentBids] = useState<(Bid & { auction_title?: string })[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Get auctions count
            const { count: totalAuctions } = await supabase
                .from('auctions')
                .select('*', { count: 'exact', head: true })

            const { count: activeAuctions } = await supabase
                .from('auctions')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)

            // Get bids stats
            const { data: bidsData } = await supabase
                .from('bids')
                .select('bid_amount')

            const totalBids = bidsData?.length || 0
            const totalAmount = bidsData?.reduce((sum, bid) => sum + bid.bid_amount, 0) || 0

            setStats({
                totalAuctions: totalAuctions || 0,
                activeAuctions: activeAuctions || 0,
                totalBids,
                totalAmount
            })

            // Get recent bids
            const { data: recentBidsData } = await supabase
                .from('bids')
                .select(`
          *,
          auctions ( title )
        `)
                .order('created_at', { ascending: false })
                .limit(5)

            if (recentBidsData) {
                setRecentBids(recentBidsData.map(bid => ({
                    ...bid,
                    auction_title: (bid.auctions as unknown as Auction)?.title
                })))
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-sm text-gray-500">SMA Yardım Açık Artırması</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/" target="_blank">
                                <Button variant="ghost" size="sm">
                                    Siteyi Görüntüle
                                </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Çıkış Yap
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Ürün</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalAuctions}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Aktif Ürün</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeAuctions}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Teklif</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalBids}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Tutar</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions & Recent Bids */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Hızlı İşlemler</h2>
                        <div className="space-y-3">
                            <Link to="/admin/auctions/new">
                                <Button className="w-full justify-start" variant="outline">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Yeni Ürün Ekle
                                </Button>
                            </Link>
                            <Link to="/admin/auctions">
                                <Button className="w-full justify-start" variant="outline">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    Tüm Ürünleri Görüntüle
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Recent Bids */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Son Teklifler</h2>
                        {recentBids.length > 0 ? (
                            <div className="space-y-3">
                                {recentBids.map(bid => (
                                    <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{bid.bidder_name}</p>
                                            <p className="text-sm text-gray-500">{bid.auction_title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary-600">{formatCurrency(bid.bid_amount)}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(bid.created_at).toLocaleString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Henüz teklif yok</p>
                        )}
                    </motion.div>
                </div>
            </main>
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
