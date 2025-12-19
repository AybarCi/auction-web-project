import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Patient, BankAccount } from '../../lib/types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const MAX_BANK_ACCOUNTS = 5

export default function PatientManagement() {
    const navigate = useNavigate()
    const [patient, setPatient] = useState<Patient | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Bank accounts state
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [isAddingAccount, setIsAddingAccount] = useState(false)
    const [newAccount, setNewAccount] = useState({
        bank_name: '',
        account_holder: '',
        iban: ''
    })

    const [form, setForm] = useState({
        full_name: '',
        description: '',
        social_instagram: '',
        social_twitter: '',
        social_facebook: '',
        social_tiktok: '',
        photo_url: ''
    })

    const [documents, setDocuments] = useState({
        governorship: null as File | null,
        gene_report: null as File | null,
        hospital_proposal: null as File | null,
        medical_report: null as File | null
    })

    useEffect(() => {
        fetchPatient()
    }, [])

    const fetchPatient = async () => {
        try {
            const { data } = await supabase.from('patients').select('*').limit(1)
            if (data && data.length > 0) {
                const p = data[0] as Patient
                setPatient(p)
                setForm({
                    full_name: p.full_name || '',
                    description: p.description || '',
                    social_instagram: p.social_instagram || '',
                    social_twitter: p.social_twitter || '',
                    social_facebook: p.social_facebook || '',
                    social_tiktok: p.social_tiktok || '',
                    photo_url: p.photo_url || ''
                })
                // Fetch bank accounts for this patient
                await fetchBankAccounts(p.id)
            }
        } catch (err) {
            console.error('Error fetching patient:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchBankAccounts = async (patientId: string) => {
        try {
            const { data } = await supabase
                .from('patient_bank_accounts')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: true })
            if (data) {
                setBankAccounts(data as BankAccount[])
            }
        } catch (err) {
            console.error('Error fetching bank accounts:', err)
        }
    }

    const formatIBANInput = (value: string): string => {
        // Remove all non-alphanumeric characters and convert to uppercase
        const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        // Limit to 26 characters (Turkish IBAN length)
        return cleaned.slice(0, 26)
    }

    const handleAddBankAccount = async () => {
        if (!patient || bankAccounts.length >= MAX_BANK_ACCOUNTS) return
        if (!newAccount.bank_name || !newAccount.account_holder || !newAccount.iban) {
            setError('Lütfen tüm hesap bilgilerini doldurun')
            return
        }

        try {
            const { error: insertError } = await (supabase
                .from('patient_bank_accounts') as any)
                .insert({
                    patient_id: patient.id,
                    bank_name: newAccount.bank_name,
                    account_holder: newAccount.account_holder,
                    iban: newAccount.iban
                })

            if (insertError) throw insertError

            await fetchBankAccounts(patient.id)
            setNewAccount({ bank_name: '', account_holder: '', iban: '' })
            setIsAddingAccount(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Hesap eklenirken hata oluştu')
        }
    }

    const handleDeleteBankAccount = async (accountId: string) => {
        if (!patient) return

        try {
            const { error: deleteError } = await supabase
                .from('patient_bank_accounts')
                .delete()
                .eq('id', accountId)

            if (deleteError) throw deleteError

            await fetchBankAccounts(patient.id)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Hesap silinirken hata oluştu')
        }
    }

    const uploadDocument = async (file: File, folder: string): Promise<string> => {
        const fileName = `${folder}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('patient-documents').upload(fileName, file)
        if (error) throw error
        const { data } = supabase.storage.from('patient-documents').getPublicUrl(fileName)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const docUrls: any = {}

            if (documents.governorship) {
                docUrls.document_governorship = await uploadDocument(documents.governorship, 'governorship')
            }
            if (documents.gene_report) {
                docUrls.document_gene_report = await uploadDocument(documents.gene_report, 'gene-report')
            }
            if (documents.hospital_proposal) {
                docUrls.document_hospital_proposal = await uploadDocument(documents.hospital_proposal, 'hospital-proposal')
            }
            if (documents.medical_report) {
                docUrls.document_medical_report = await uploadDocument(documents.medical_report, 'medical-report')
            }

            const patientData = {
                full_name: form.full_name,
                description: form.description,
                social_instagram: form.social_instagram || null,
                social_twitter: form.social_twitter || null,
                social_facebook: form.social_facebook || null,
                social_tiktok: form.social_tiktok || null,
                photo_url: form.photo_url || null,
                is_active: true,
                ...docUrls
            }

            if (patient) {
                await (supabase.from('patients') as any).update(patientData).eq('id', patient.id)
            } else {
                await (supabase.from('patients') as any).insert(patientData)
            }

            setSuccess(true)
            fetchPatient()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu')
        } finally {
            setIsSaving(false)
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
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/admin"><Button variant="ghost" size="sm">← Geri</Button></Link>
                        <h1 className="text-xl font-bold">Hasta Bilgileri</h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>Çıkış</Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Temel Bilgiler */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold mb-4">Temel Bilgiler</h2>
                        <div className="space-y-4">
                            <Input
                                label="Ad Soyad"
                                value={form.full_name}
                                onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta Hikayesi / Açıklama</label>
                                <textarea
                                    rows={6}
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Hastanın hikayesini ve durumunu açıklayın..."
                                />
                            </div>
                            <Input
                                label="Fotoğraf URL (veya aşağıdan yükleyin)"
                                value={form.photo_url}
                                onChange={(e) => setForm(f => ({ ...f, photo_url: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Sosyal Medya */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold mb-4">Sosyal Medya Hesapları</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Instagram"
                                value={form.social_instagram}
                                onChange={(e) => setForm(f => ({ ...f, social_instagram: e.target.value }))}
                                placeholder="https://instagram.com/..."
                            />
                            <Input
                                label="Twitter / X"
                                value={form.social_twitter}
                                onChange={(e) => setForm(f => ({ ...f, social_twitter: e.target.value }))}
                                placeholder="https://twitter.com/..."
                            />
                            <Input
                                label="Facebook"
                                value={form.social_facebook}
                                onChange={(e) => setForm(f => ({ ...f, social_facebook: e.target.value }))}
                                placeholder="https://facebook.com/..."
                            />
                            <Input
                                label="TikTok"
                                value={form.social_tiktok}
                                onChange={(e) => setForm(f => ({ ...f, social_tiktok: e.target.value }))}
                                placeholder="https://tiktok.com/..."
                            />
                        </div>
                    </div>

                    {/* Belgeler */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold mb-4">Resmi Belgeler</h2>
                        <p className="text-sm text-gray-500 mb-4">PDF veya görsel dosyalar yükleyebilirsiniz</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valilik Onay Belgesi</label>
                                {patient?.document_governorship && (
                                    <a href={patient.document_governorship} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm underline block mb-2">Mevcut belgeyi görüntüle</a>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setDocuments(d => ({ ...d, governorship: e.target.files?.[0] || null }))}
                                    className="w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gen Raporu</label>
                                {patient?.document_gene_report && (
                                    <a href={patient.document_gene_report} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm underline block mb-2">Mevcut belgeyi görüntüle</a>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setDocuments(d => ({ ...d, gene_report: e.target.files?.[0] || null }))}
                                    className="w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hastane Teklifi</label>
                                {patient?.document_hospital_proposal && (
                                    <a href={patient.document_hospital_proposal} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm underline block mb-2">Mevcut belgeyi görüntüle</a>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setDocuments(d => ({ ...d, hospital_proposal: e.target.files?.[0] || null }))}
                                    className="w-full text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tıbbi Rapor / İzin Belgesi</label>
                                {patient?.document_medical_report && (
                                    <a href={patient.document_medical_report} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm underline block mb-2">Mevcut belgeyi görüntüle</a>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setDocuments(d => ({ ...d, medical_report: e.target.files?.[0] || null }))}
                                    className="w-full text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hesap Bilgileri */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">💳 Hesap Bilgileri</h2>
                            <span className="text-sm text-gray-500">{bankAccounts.length}/{MAX_BANK_ACCOUNTS} hesap</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Bağış için banka hesap bilgilerini ekleyin (maksimum {MAX_BANK_ACCOUNTS} hesap)</p>

                        {/* Existing bank accounts */}
                        <div className="space-y-3 mb-4">
                            {bankAccounts.map((account) => (
                                <div key={account.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{account.bank_name}</p>
                                            <p className="text-sm text-gray-600">Alıcı: {account.account_holder}</p>
                                            <p className="text-sm font-mono text-gray-700 mt-1">
                                                IBAN: {account.iban.match(/.{1,4}/g)?.join(' ') || account.iban}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBankAccount(account.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Hesabı Sil"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add new account form */}
                        {isAddingAccount ? (
                            <div className="border border-primary-200 rounded-lg p-4 bg-primary-50">
                                <h3 className="font-medium text-gray-900 mb-3">Yeni Hesap Ekle</h3>
                                <div className="space-y-3">
                                    <Input
                                        label="Banka İsmi"
                                        value={newAccount.bank_name}
                                        onChange={(e) => setNewAccount(a => ({ ...a, bank_name: e.target.value }))}
                                        placeholder="örn: Ziraat Bankası"
                                    />
                                    <Input
                                        label="Alıcı İsmi"
                                        value={newAccount.account_holder}
                                        onChange={(e) => setNewAccount(a => ({ ...a, account_holder: e.target.value }))}
                                        placeholder="Hesap sahibinin adı soyadı"
                                    />
                                    <Input
                                        label="IBAN"
                                        value={newAccount.iban}
                                        onChange={(e) => setNewAccount(a => ({ ...a, iban: formatIBANInput(e.target.value) }))}
                                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                                        maxLength={26}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsAddingAccount(false)
                                                setNewAccount({ bank_name: '', account_holder: '', iban: '' })
                                            }}
                                            className="flex-1"
                                        >
                                            İptal
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleAddBankAccount}
                                            className="flex-1"
                                        >
                                            Ekle
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            bankAccounts.length < MAX_BANK_ACCOUNTS && (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingAccount(true)}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Yeni Hesap Ekle
                                </button>
                            )
                        )}
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}
                    {success && <div className="bg-green-50 text-green-600 p-4 rounded-lg">Bilgiler başarıyla kaydedildi!</div>}

                    <div className="flex gap-4">
                        <Link to="/admin" className="flex-1">
                            <Button variant="outline" className="w-full" type="button">İptal</Button>
                        </Link>
                        <Button type="submit" className="flex-1" isLoading={isSaving}>
                            {patient ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
