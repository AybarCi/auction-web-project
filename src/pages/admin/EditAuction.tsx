import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import type { Auction } from '../../lib/types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const auctionSchema = z.object({
    title: z.string().min(3, 'Başlık en az 3 karakter olmalı'),
    description: z.string().optional(),
    min_bid_amount: z.number().min(0, 'Minimum teklif 0 veya daha fazla olmalı'),
    end_time: z.string().min(1, 'Bitiş tarihi seçin'),
    is_active: z.boolean()
})

type AuctionFormData = z.infer<typeof auctionSchema>

export default function EditAuction() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [existingImages, setExistingImages] = useState<string[]>([])

    const { register, handleSubmit, formState: { errors }, reset } = useForm<AuctionFormData>({
        resolver: zodResolver(auctionSchema)
    })

    useEffect(() => {
        const fetchAuction = async () => {
            if (!id) return
            const { data } = await supabase.from('auctions').select('*').eq('id', id).single()
            const auction = data as Auction | null
            if (auction) {
                reset({
                    title: auction.title,
                    description: auction.description || '',
                    min_bid_amount: auction.min_bid_amount,
                    end_time: new Date(auction.end_time).toISOString().slice(0, 16),
                    is_active: auction.is_active
                })
                setExistingImages(auction.image_urls || [])
            }
            setIsLoading(false)
        }
        fetchAuction()
    }, [id, reset])

    const onSubmit = async (data: AuctionFormData) => {
        if (!id) return
        setIsSubmitting(true)
        setError(null)
        try {
            const { error: updateError } = await (supabase.from('auctions') as any).update({
                title: data.title,
                description: data.description || null,
                min_bid_amount: data.min_bid_amount,
                end_time: new Date(data.end_time).toISOString(),
                is_active: data.is_active,
                image_urls: existingImages
            }).eq('id', id)
            if (updateError) throw updateError
            navigate('/admin/auctions')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/admin/auctions"><Button variant="ghost" size="sm">← Geri</Button></Link>
                    <h1 className="text-xl font-bold">Ürün Düzenle</h1>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input label="Ürün Başlığı" error={errors.title?.message} {...register('title')} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                            <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200" {...register('description')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Teklif (₺)</label>
                            <input type="number" min={0} className="w-full px-4 py-3 rounded-xl border border-gray-200" {...register('min_bid_amount', { valueAsNumber: true })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                            <input type="datetime-local" className="w-full px-4 py-3 rounded-xl border border-gray-200" {...register('end_time')} />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="is_active" {...register('is_active')} className="w-5 h-5" />
                            <label htmlFor="is_active" className="font-medium">Aktif</label>
                        </div>
                        {existingImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-3">
                                {existingImages.map((url, i) => (
                                    <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                                ))}
                            </div>
                        )}
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
                        <div className="flex gap-3">
                            <Link to="/admin/auctions" className="flex-1"><Button variant="outline" className="w-full" type="button">İptal</Button></Link>
                            <Button type="submit" className="flex-1" isLoading={isSubmitting}>Kaydet</Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
