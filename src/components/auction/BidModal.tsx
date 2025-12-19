import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'
import type { Bid } from '../../lib/types'

const bidSchema = z.object({
    bidder_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
    bidder_phone: z.string()
        .min(10, 'Geçerli bir telefon numarası girin')
        .regex(/^[0-9+\-\s()]+$/, 'Geçersiz telefon numarası formatı'),
    bid_amount: z.number()
        .min(1, 'Teklif tutarı giriniz')
})

type BidFormData = z.infer<typeof bidSchema>

interface BidModalProps {
    isOpen: boolean
    onClose: () => void
    auctionId: string
    minBidAmount: number
    currentHighestBid: Bid | null
    onBidSuccess: () => void
}

export default function BidModal({
    isOpen,
    onClose,
    auctionId,
    minBidAmount,
    currentHighestBid,
    onBidSuccess
}: BidModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
    const [termsChecked, setTermsChecked] = useState(false)

    const minimumBid = currentHighestBid
        ? currentHighestBid.bid_amount + 100
        : minBidAmount

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BidFormData>({
        resolver: zodResolver(bidSchema),
        defaultValues: {
            bid_amount: minimumBid
        }
    })

    // Reset terms acceptance when modal closes
    useEffect(() => {
        if (!isOpen) {
            setHasAcceptedTerms(false)
            setTermsChecked(false)
        }
    }, [isOpen])

    const onSubmit = async (data: BidFormData) => {
        if (data.bid_amount < minimumBid) {
            setSubmitError(`Teklif en az ${formatCurrency(minimumBid)} olmalıdır`)
            return
        }

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const { error } = await supabase
                .from('bids')
                .insert({
                    auction_id: auctionId,
                    bid_amount: data.bid_amount,
                    bidder_name: data.bidder_name,
                    bidder_phone: data.bidder_phone
                } as any)

            if (error) {
                if (error.message.includes('mevcut teklifin')) {
                    setSubmitError('Teklifiniz mevcut en yüksek teklifin altında kaldı. Lütfen sayfayı yenileyip tekrar deneyin.')
                } else {
                    setSubmitError(error.message)
                }
                return
            }

            setIsSuccess(true)
            onBidSuccess()

            // Reset and close after 2 seconds
            setTimeout(() => {
                reset()
                setIsSuccess(false)
                setHasAcceptedTerms(false)
                setTermsChecked(false)
                onClose()
            }, 2000)

        } catch (err) {
            setSubmitError('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        reset()
        setSubmitError(null)
        setIsSuccess(false)
        setHasAcceptedTerms(false)
        setTermsChecked(false)
        onClose()
    }

    const handleAcceptTerms = () => {
        if (termsChecked) {
            setHasAcceptedTerms(true)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={hasAcceptedTerms ? "Teklif Ver" : "Hukuki Bilgilendirme"}>
            {isSuccess ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Teklifiniz Alındı!</h3>
                    <p className="text-gray-600">Açık artırma sonunda sizinle iletişime geçeceğiz.</p>
                </div>
            ) : !hasAcceptedTerms ? (
                /* Legal Disclaimer Step */
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-h-80 overflow-y-auto">
                        <h3 className="font-bold text-red-800 text-lg mb-4">
                            HUKUKİ SORUMLULUK VE BORÇ TAAHHÜTNAMESİ
                        </h3>

                        <div className="space-y-4 text-sm text-red-900">
                            <div>
                                <p className="font-semibold">1. HUKUKİ NİTELİK:</p>
                                <p className="mt-1">
                                    İşbu form aracılığıyla iletilen irade beyanı, 6098 sayılı Türk Borçlar Kanunu (TBK)
                                    Madde 4 ve devamı uyarınca bağlayıcı bir "İcap" (Teklif) ve/veya "Kabul" niteliğindedir.
                                    Katılımcı, "Gönder" veya "Hemen Al" butonuna bastığı an itibarıyla borç altına girdiğini
                                    gayrikabili rücu kabul eder.
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold">2. CAYMA VE CEZAİ ŞART:</p>
                                <p className="mt-1">
                                    Yardım kampanyasının suistimal edilmesini önlemek amacıyla; teklif verip ödeme yapmayan
                                    katılımcı hakkında, kampanya sahibinin uğradığı maddi ve manevi zararların tazmini için
                                    yasal yollara başvurulacaktır. Kampanya valilik onaylı olduğundan, sahte teklifler
                                    "Kamu Güvenini Kötüye Kullanma" suçu kapsamında değerlendirilebilir.
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold">3. DELİL SÖZLEŞMESİ:</p>
                                <p className="mt-1">
                                    Hukuk Muhakemeleri Kanunu Madde 193 uyarınca; katılımcının IP adresi, cihaz bilgisi,
                                    tarayıcı kayıtları ve zaman damgası, taraflar arasında münhasır delil niteliği taşır.
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold">4. KVKK:</p>
                                <p className="mt-1">
                                    Kişisel verileriniz, yasal yükümlülüklerin yerine getirilmesi ve yetkili makamlara
                                    (Savcılık/Mahkeme) bilgi verilmesi amacıyla işlenmektedir.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Important Warning */}
                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="font-bold text-yellow-800">ÖNEMLİ UYARI</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Ödeme yapmayacaksanız lütfen işlem yapmayınız. İşleminiz doğrudan
                                    Emniyet ve Adli birimlerce izlenebilir niteliktedir.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={termsChecked}
                            onChange={(e) => setTermsChecked(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                            Yukarıdaki hukuki bilgilendirmeyi okudum ve <strong>kabul ediyorum</strong>.
                            Teklif vererek borç altına girdiğimi anlıyorum.
                        </span>
                    </label>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Vazgeç
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleAcceptTerms}
                            disabled={!termsChecked}
                        >
                            Devam Et
                        </Button>
                    </div>
                </div>
            ) : (
                /* Bid Form Step */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="bg-primary-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-primary-700">
                            Minimum teklif: <span className="font-bold">{formatCurrency(minimumBid)}</span>
                        </p>
                    </div>

                    <Input
                        label="Ad Soyad"
                        placeholder="Adınız ve soyadınız"
                        error={errors.bidder_name?.message}
                        {...register('bidder_name')}
                    />

                    <Input
                        label="Telefon Numarası"
                        placeholder="05XX XXX XX XX"
                        type="tel"
                        error={errors.bidder_phone?.message}
                        {...register('bidder_phone')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teklif Tutarı (₺)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                            <input
                                type="number"
                                min={minimumBid}
                                step={100}
                                className={`
                  w-full pl-10 pr-4 py-3 rounded-xl border bg-white
                  transition-all duration-200 font-mono text-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.bid_amount ? 'border-red-500' : 'border-gray-200'}
                `}
                                {...register('bid_amount', { valueAsNumber: true })}
                            />
                        </div>
                        {errors.bid_amount && (
                            <p className="mt-1 text-sm text-red-500">{errors.bid_amount.message}</p>
                        )}
                    </div>

                    {/* Quick bid buttons */}
                    <div className="flex gap-2">
                        {[100, 500, 1000].map(amount => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => setValue('bid_amount', (currentHighestBid?.bid_amount || minBidAmount) + amount)}
                                className="flex-1 py-2 px-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                            >
                                +{amount} ₺
                            </button>
                        ))}
                    </div>

                    {submitError && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                            {submitError}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isSubmitting}
                    >
                        Teklif Ver
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        Teklif vererek, açık artırma kazanırsanız ödeme yapacağınızı kabul etmiş olursunuz.
                    </p>
                </form>
            )}
        </Modal>
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

