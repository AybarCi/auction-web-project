import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuction } from '../context/AuctionContext'
import ImageGallery from '../components/auction/ImageGallery'
import CountdownTimer from '../components/auction/CountdownTimer'
import CurrentBid from '../components/auction/CurrentBid'
import BidModal from '../components/auction/BidModal'
import Button from '../components/ui/Button'

export default function HomePage() {
    const navigate = useNavigate()
    const { activeAuction, highestBid, bidCount, isLoading, error, refreshAuction } = useAuction()
    const [isBidModalOpen, setIsBidModalOpen] = useState(false)

    const handleAuctionEnd = () => {
        navigate('/bitti')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Bir hata oluştu</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Yenile</Button>
                </div>
            </div>
        )
    }

    if (!activeAuction) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Şu anda aktif açık artırma yok</h2>
                    <p className="text-gray-600">Yeni açık artırmalar için takipte kalın!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold gradient-text">SMA Yardım</h1>
                            <p className="text-xs text-gray-500">Açık Artırma Platformu</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Canlı
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Hero Section - SMA Story */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-6 sm:p-8 mb-8 text-white"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">Umut Olmak İçin Teklif Verin</h2>
                            <p className="text-white/90 text-sm sm:text-base">
                                SMA hastası çocuğumuzun tedavisi için düzenlenen bu açık artırmada,
                                vereceğiniz her teklif bir umut ışığı oluyor. Bağışlarınız için teşekkür ederiz.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <ImageGallery
                            images={activeAuction.image_urls}
                            title={activeAuction.title}
                        />
                    </motion.div>

                    {/* Right Column - Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Title & Description */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                                {activeAuction.title}
                            </h2>
                            {activeAuction.description && (
                                <p className="text-gray-600 leading-relaxed">
                                    {activeAuction.description}
                                </p>
                            )}
                        </div>

                        {/* Countdown */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">
                                Açık Artırma Bitiş Süresi
                            </h3>
                            <CountdownTimer
                                endTime={activeAuction.end_time}
                                onEnd={handleAuctionEnd}
                            />
                        </div>

                        {/* Current Bid */}
                        <CurrentBid
                            highestBid={highestBid}
                            minBidAmount={activeAuction.min_bid_amount}
                            bidCount={bidCount}
                        />

                        {/* Bid Button */}
                        <Button
                            onClick={() => setIsBidModalOpen(true)}
                            size="lg"
                            className="w-full text-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Teklif Ver
                        </Button>

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Güvenli</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Şeffaf</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>Hayır İçin</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 mt-16 py-8">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2024 SMA Yardım Açık Artırması. Tüm hakları saklıdır.
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                        Bu platform hayır amaçlı oluşturulmuştur.
                    </p>
                </div>
            </footer>

            {/* Bid Modal */}
            <BidModal
                isOpen={isBidModalOpen}
                onClose={() => setIsBidModalOpen(false)}
                auctionId={activeAuction.id}
                minBidAmount={activeAuction.min_bid_amount}
                currentHighestBid={highestBid}
                onBidSuccess={refreshAuction}
            />
        </div>
    )
}
