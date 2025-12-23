import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { Auction, Bid } from '../../lib/types'
import Button from '../../components/ui/Button'

interface CompletedAuction extends Auction {
    winner?: Bid | null
    bid_count: number
}

type FilterPeriod = 'all' | '7days' | '30days'

export default function AdminHistory() {
    const navigate = useNavigate()
    const [auctions, setAuctions] = useState<CompletedAuction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all')
    const [selectedBids, setSelectedBids] = useState<Bid[]>([])
    const [showBidsModal, setShowBidsModal] = useState(false)
    const [selectedAuctionTitle, setSelectedAuctionTitle] = useState('')

    useEffect(() => {
        fetchCompletedAuctions()
    }, [filterPeriod])

    const fetchCompletedAuctions = async () => {
        setIsLoading(true)
        try {
            let query = supabase
                .from('auctions')
                .select('*')
                .or('is_active.eq.false,end_time.lt.now()')
                .order('end_time', { ascending: false })

            // Apply date filter
            if (filterPeriod === '7days') {
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                query = query.gte('end_time', sevenDaysAgo.toISOString())
            } else if (filterPeriod === '30days') {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                query = query.gte('end_time', thirtyDaysAgo.toISOString())
            }

            const { data: auctionsData } = await query.returns<Auction[]>()

            if (auctionsData && auctionsData.length > 0) {
                // Get winner and bid count for each auction
                const auctionsWithWinners = await Promise.all(
                    auctionsData.map(async (auction) => {
                        const { data: bidsData } = await supabase
                            .from('bids')
                            .select('*')
                            .eq('auction_id', auction.id)
                            .order('bid_amount', { ascending: false })
                            .returns<Bid[]>()

                        return {
                            ...auction,
                            winner: bidsData && bidsData.length > 0 ? bidsData[0] : null,
                            bid_count: bidsData?.length || 0
                        }
                    })
                )
                setAuctions(auctionsWithWinners)
            } else {
                setAuctions([])
            }
        } catch (error) {
            console.error('Error fetching completed auctions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewBids = async (auctionId: string, auctionTitle: string) => {
        const { data } = await supabase
            .from('bids')
            .select('*')
            .eq('auction_id', auctionId)
            .order('bid_amount', { ascending: false })
            .returns<Bid[]>()

        if (data) {
            setSelectedBids(data)
            setSelectedAuctionTitle(auctionTitle)
            setShowBidsModal(true)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    const exportToCSV = () => {
        const headers = ['Ürün', 'Bitiş Tarihi', 'Kazanan Adı', 'Kazanan Telefon', 'Kazanan Teklif', 'Toplam Teklif']
        const rows = auctions.map(auction => [
            auction.title,
            new Date(auction.end_time).toLocaleString('tr-TR'),
            auction.winner?.bidder_name || '-',
            auction.winner?.bidder_phone || '-',
            auction.winner?.bid_amount || 0,
            auction.bid_count
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `acik-artirma-gecmisi-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
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
                        <div className="flex items-center gap-4">
                            <Link to="/admin">
                                <Button variant="ghost" size="sm">
                                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Geri
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Açık Artırma Geçmişi</h1>
                                <p className="text-sm text-gray-500">Sona ermiş açık artırmalar ve kazananlar</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={exportToCSV}>
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                CSV İndir
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Çıkış
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Filtrele:</span>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'Tümü' },
                                { value: '7days', label: 'Son 7 Gün' },
                                { value: '30days', label: 'Son 30 Gün' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterPeriod(option.value as FilterPeriod)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterPeriod === option.value
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <span className="ml-auto text-sm text-gray-500">
                            {auctions.length} açık artırma bulundu
                        </span>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tamamlanan</p>
                                <p className="text-xl font-bold text-gray-900">{auctions.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Teklif</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {auctions.reduce((sum, a) => sum + a.bid_count, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam Kazanılan</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(auctions.reduce((sum, a) => sum + (a.winner?.bid_amount || 0), 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {auctions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Henüz bitmiş açık artırma yok</h2>
                        <p className="text-gray-600">Bu dönemde tamamlanmış açık artırma bulunamadı.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ürün
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bitiş Tarihi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kazanan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Telefon
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kazanan Teklif
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auctions.map((auction) => (
                                    <motion.tr
                                        key={auction.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {auction.image_urls?.[0] && (
                                                    <img
                                                        src={auction.image_urls[0]}
                                                        alt={auction.title}
                                                        className="w-10 h-10 rounded-lg object-cover mr-3"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{auction.title}</p>
                                                    <p className="text-sm text-gray-500">{auction.bid_count} teklif</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(auction.end_time).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {auction.winner ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">🏆</span>
                                                    <span className="font-medium text-gray-900">{auction.winner.bidder_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Teklif yok</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {auction.winner ? (
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`tel:${auction.winner.bidder_phone}`}
                                                        className="text-primary-600 hover:text-primary-700 font-medium"
                                                    >
                                                        {auction.winner.bidder_phone}
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${auction.winner.bidder_phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                                        title="WhatsApp'ta aç"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {auction.winner ? (
                                                <span className="font-bold text-primary-600">
                                                    {formatCurrency(auction.winner.bid_amount)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewBids(auction.id, auction.title)}
                                            >
                                                Tüm Teklifler
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Bids Modal */}
                {showBidsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Teklifler</h2>
                                    <p className="text-sm text-gray-500">{selectedAuctionTitle}</p>
                                </div>
                                <button
                                    onClick={() => setShowBidsModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 overflow-auto max-h-[60vh]">
                                {selectedBids.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Bu ürüne teklif verilmedi</p>
                                ) : (
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-2 text-sm font-medium text-gray-500">Sıra</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-500">Ad Soyad</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-500">Telefon</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-500">Teklif</th>
                                                <th className="text-left py-2 text-sm font-medium text-gray-500">Tarih</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBids.map((bid, index) => (
                                                <tr key={bid.id} className={index === 0 ? 'bg-green-50' : ''}>
                                                    <td className="py-3">
                                                        {index === 0 && <span className="text-lg">🏆</span>}
                                                        {index > 0 && <span className="text-gray-400">{index + 1}</span>}
                                                    </td>
                                                    <td className="py-3 font-medium">{bid.bidder_name}</td>
                                                    <td className="py-3">
                                                        <a
                                                            href={`tel:${bid.bidder_phone}`}
                                                            className="text-primary-600 hover:underline"
                                                        >
                                                            {bid.bidder_phone}
                                                        </a>
                                                    </td>
                                                    <td className="py-3 font-bold text-primary-600">
                                                        {formatCurrency(bid.bid_amount)}
                                                    </td>
                                                    <td className="py-3 text-sm text-gray-500">
                                                        {new Date(bid.created_at).toLocaleString('tr-TR')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
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
