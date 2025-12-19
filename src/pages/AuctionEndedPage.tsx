import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Auction, Bid, BankAccount } from '../lib/types'
import Button from '../components/ui/Button'

export default function AuctionEndedPage() {
    const [auction, setAuction] = useState<Auction | null>(null)
    const [winner, setWinner] = useState<Bid | null>(null)
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [copiedIban, setCopiedIban] = useState<string | null>(null)

    const formatIBAN = (iban: string): string => {
        return iban.match(/.{1,4}/g)?.join(' ') || iban
    }

    const copyToClipboard = async (iban: string) => {
        try {
            await navigator.clipboard.writeText(iban)
            setCopiedIban(iban)
            setTimeout(() => setCopiedIban(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

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

                // Fetch bank accounts from active patient
                const { data: patients } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('is_active', true)
                    .limit(1)

                if (patients && patients.length > 0) {
                    const patientId = (patients[0] as { id: string }).id
                    const { data: accounts } = await supabase
                        .from('patient_bank_accounts')
                        .select('*')
                        .eq('patient_id', patientId)
                        .order('created_at', { ascending: true })
                    if (accounts) {
                        setBankAccounts(accounts as BankAccount[])
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

                        {/* Bank info */}
                        {bankAccounts.length > 0 ? (
                            <div className="border border-gray-200 rounded-xl p-4 mb-6">
                                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Ödeme Bilgileri
                                </h4>
                                <div className="space-y-3">
                                    {bankAccounts.map((account) => (
                                        <div key={account.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{account.bank_name}</p>
                                                    <p className="text-xs text-gray-600">{account.account_holder}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                                                <span className="flex-1 font-mono text-xs text-gray-800 select-all">{formatIBAN(account.iban)}</span>
                                                <button
                                                    onClick={() => copyToClipboard(account.iban)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors"
                                                >
                                                    {copiedIban === account.iban ? (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Kopyalandı
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Kopyala
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
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
                        )}

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
