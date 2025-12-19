import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Patient, BankAccount } from '../lib/types'
import Button from '../components/ui/Button'

export default function PatientPage() {
    const [patient, setPatient] = useState<Patient | null>(null)
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
        const fetchPatient = async () => {
            const { data } = await supabase.from('patients').select('*').eq('is_active', true).limit(1)
            if (data && data.length > 0) {
                const p = data[0] as Patient
                setPatient(p)
                // Fetch bank accounts
                const { data: accounts } = await supabase
                    .from('patient_bank_accounts')
                    .select('*')
                    .eq('patient_id', p.id)
                    .order('created_at', { ascending: true })
                if (accounts) {
                    setBankAccounts(accounts as BankAccount[])
                }
            }
            setIsLoading(false)
        }
        fetchPatient()
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Hasta bilgisi bulunamadı</h2>
                    <Link to="/"><Button>Ana Sayfaya Dön</Button></Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/"><Button variant="ghost" size="sm">← Ana Sayfa</Button></Link>
                    <h1 className="text-xl font-bold">Hasta Bilgileri</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Patient Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8"
                >
                    <div className="flex items-center gap-6">
                        {patient.photo_url && (
                            <img
                                src={patient.photo_url}
                                alt={patient.full_name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white/30"
                            />
                        )}
                        <div>
                            <h2 className="text-3xl font-bold mb-2">{patient.full_name}</h2>
                            <p className="text-white/80 text-lg">SMA Hastası</p>
                        </div>
                    </div>
                </motion.div>

                {/* Story */}
                {patient.description && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-sm border p-8 mb-8"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Hikayemiz
                        </h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">{patient.description}</p>
                    </motion.div>
                )}

                {/* Social Media */}
                {(patient.social_instagram || patient.social_twitter || patient.social_facebook || patient.social_tiktok) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-sm border p-8 mb-8"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Bizi Takip Edin</h3>
                        <div className="flex flex-wrap gap-4">
                            {patient.social_instagram && (
                                <a href={patient.social_instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                    <span className="font-medium">Instagram</span>
                                </a>
                            )}
                            {patient.social_twitter && (
                                <a href={patient.social_twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:opacity-90 transition-opacity">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    <span className="font-medium">X (Twitter)</span>
                                </a>
                            )}
                            {patient.social_facebook && (
                                <a href={patient.social_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:opacity-90 transition-opacity">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    <span className="font-medium">Facebook</span>
                                </a>
                            )}
                            {patient.social_tiktok && (
                                <a href={patient.social_tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:opacity-90 transition-opacity">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                                    <span className="font-medium">TikTok</span>
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Documents */}
                {(patient.document_governorship || patient.document_gene_report || patient.document_hospital_proposal || patient.document_medical_report) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl shadow-sm border p-8 mb-8"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Resmi Belgeler
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {patient.document_governorship && (
                                <a href={patient.document_governorship} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Valilik Onay Belgesi</p>
                                        <p className="text-sm text-gray-500">Görüntülemek için tıklayın</p>
                                    </div>
                                </a>
                            )}
                            {patient.document_gene_report && (
                                <a href={patient.document_gene_report} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Gen Raporu</p>
                                        <p className="text-sm text-gray-500">Görüntülemek için tıklayın</p>
                                    </div>
                                </a>
                            )}
                            {patient.document_hospital_proposal && (
                                <a href={patient.document_hospital_proposal} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Hastane Teklifi</p>
                                        <p className="text-sm text-gray-500">Görüntülemek için tıklayın</p>
                                    </div>
                                </a>
                            )}
                            {patient.document_medical_report && (
                                <a href={patient.document_medical_report} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Tıbbi Rapor</p>
                                        <p className="text-sm text-gray-500">Görüntülemek için tıklayın</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Bank Accounts */}
                {bankAccounts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-sm border p-8 mb-8"
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Bağış Hesapları
                        </h3>
                        <div className="space-y-4">
                            {bankAccounts.map((account) => (
                                <div key={account.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{account.bank_name}</p>
                                                <p className="text-sm text-gray-600">{account.account_holder}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                                        <span className="text-xs text-gray-500 font-medium">IBAN:</span>
                                        <span className="flex-1 font-mono text-sm text-gray-800 select-all">{formatIBAN(account.iban)}</span>
                                        <button
                                            onClick={() => copyToClipboard(account.iban)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
                                        >
                                            {copiedIban === account.iban ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Kopyalandı
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    </motion.div>
                )}

                {/* Back Button */}
                <Link to="/">
                    <Button variant="outline" className="w-full">
                        ← Açık Artırmaya Geri Dön
                    </Button>
                </Link>
            </main>
        </div>
    )
}
