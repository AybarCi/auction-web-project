import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { Auction, Bid } from '../../lib/types'
import Button from '../../components/ui/Button'

interface AuctionWithBids extends Auction {
    highest_bid?: number
    bid_count?: number
}

export default function AdminAuctions() {
    const navigate = useNavigate()
    const [auctions, setAuctions] = useState<AuctionWithBids[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [bids, setBids] = useState<Bid[]>([])
    const [showBids, setShowBids] = useState(false)

    useEffect(() => {
        fetchAuctions()
    }, [])

    const fetchAuctions = async () => {
        try {
            const { data: auctionsData } = await supabase
                .from('auctions')
                .select('*')
                .order('created_at', { ascending: false })
                .returns<Auction[]>()

            if (auctionsData) {
                // Get bid stats for each auction
                const auctionsWithBids = await Promise.all(
                    auctionsData.map(async (auction) => {
                        const { data: bidsData } = await supabase
                            .from('bids')
                            .select('bid_amount')
                            .eq('auction_id', auction.id)
                            .order('bid_amount', { ascending: false })
                            .returns<{ bid_amount: number }[]>()

                        return {
                            ...auction,
                            highest_bid: bidsData?.[0]?.bid_amount || 0,
                            bid_count: bidsData?.length || 0
                        }
                    })
                )
                setAuctions(auctionsWithBids)
            }
        } catch (error) {
            console.error('Error fetching auctions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewBids = async (auctionId: string) => {
        setShowBids(true)

        const { data } = await supabase
            .from('bids')
            .select('*')
            .eq('auction_id', auctionId)
            .order('bid_amount', { ascending: false })
            .returns<Bid[]>()

        if (data) {
            setBids(data)
        }
    }

    const handleToggleActive = async (auctionId: string, currentStatus: boolean) => {
        await (supabase.from('auctions') as any)
            .update({ is_active: !currentStatus })
            .eq('id', auctionId)

        fetchAuctions()
    }

    const handleDelete = async (auctionId: string) => {
        if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return

        await supabase
            .from('auctions')
            .delete()
            .eq('id', auctionId)

        fetchAuctions()
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
                                <h1 className="text-xl font-bold text-gray-900">Ürün Yönetimi</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/admin/auctions/new">
                                <Button size="sm">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Yeni Ürün
                                </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Çıkış
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {auctions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Henüz ürün yok</h2>
                        <p className="text-gray-600 mb-6">İlk açık artırma ürününüzü ekleyin</p>
                        <Link to="/admin/auctions/new">
                            <Button>Yeni Ürün Ekle</Button>
                        </Link>
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
                                        En Yüksek Teklif
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teklif Sayısı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bitiş
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Durum
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
                                                    <p className="text-sm text-gray-500">
                                                        Min: {formatCurrency(auction.min_bid_amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-primary-600">
                                                {formatCurrency(auction.highest_bid || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleViewBids(auction.id)}
                                                className="text-primary-600 hover:underline"
                                            >
                                                {auction.bid_count} teklif
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(auction.end_time).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleActive(auction.id, auction.is_active)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${auction.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {auction.is_active ? 'Aktif' : 'Pasif'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/admin/auctions/${auction.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        Düzenle
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(auction.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Sil
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Bids Modal */}
                {showBids && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Teklifler</h2>
                                <button
                                    onClick={() => setShowBids(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 overflow-auto max-h-[60vh]">
                                {bids.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Bu ürüne henüz teklif verilmedi</p>
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
                                            {bids.map((bid, index) => (
                                                <tr key={bid.id} className={index === 0 ? 'bg-green-50' : ''}>
                                                    <td className="py-3">
                                                        {index === 0 && <span className="text-lg">🏆</span>}
                                                        {index > 0 && <span className="text-gray-400">{index + 1}</span>}
                                                    </td>
                                                    <td className="py-3 font-medium">{bid.bidder_name}</td>
                                                    <td className="py-3 text-gray-600">{bid.bidder_phone}</td>
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
