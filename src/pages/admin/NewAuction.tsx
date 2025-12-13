import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const auctionSchema = z.object({
    title: z.string().min(3, 'Başlık en az 3 karakter olmalı'),
    description: z.string().optional(),
    min_bid_amount: z.number().min(0, 'Minimum teklif 0 veya daha fazla olmalı'),
    end_time: z.string().min(1, 'Bitiş tarihi seçin')
})

type AuctionFormData = z.infer<typeof auctionSchema>

export default function NewAuction() {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [images, setImages] = useState<File[]>([])
    const [imagePreview, setImagePreview] = useState<string[]>([])

    const { register, handleSubmit, formState: { errors } } = useForm<AuctionFormData>({
        resolver: zodResolver(auctionSchema),
        defaultValues: { min_bid_amount: 100 }
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setImages(prev => [...prev, ...files])
        files.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(prev => [...prev, reader.result as string])
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreview(prev => prev.filter((_, i) => i !== index))
    }

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = []
        for (let i = 0; i < images.length; i++) {
            const file = images[i]
            const fileName = `${Date.now()}-${i}.${file.name.split('.').pop()}`
            const { error } = await supabase.storage.from('auction-images').upload(`auctions/${fileName}`, file)
            if (error) throw error
            const { data } = supabase.storage.from('auction-images').getPublicUrl(`auctions/${fileName}`)
            urls.push(data.publicUrl)
        }
        return urls
    }

    const onSubmit = async (data: AuctionFormData) => {
        setIsSubmitting(true)
        setError(null)
        try {
            const imageUrls = images.length > 0 ? await uploadImages() : []
            const { error: insertError } = await supabase.from('auctions').insert({
                title: data.title,
                description: data.description || null,
                min_bid_amount: data.min_bid_amount,
                end_time: new Date(data.end_time).toISOString(),
                is_active: true,
                image_urls: imageUrls
            } as any)
            if (insertError) throw insertError
            navigate('/admin/auctions')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/admin/auctions"><Button variant="ghost" size="sm">← Geri</Button></Link>
                    <h1 className="text-xl font-bold">Yeni Ürün Ekle</h1>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input label="Ürün Başlığı" placeholder="Örn: İmzalı Forma" error={errors.title?.message} {...register('title')} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                            <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Ürün hakkında detaylı bilgi..." {...register('description')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Teklif (₺)</label>
                            <input type="number" min={0} step={100} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono" {...register('min_bid_amount', { valueAsNumber: true })} />
                            {errors.min_bid_amount && <p className="mt-1 text-sm text-red-500">{errors.min_bid_amount.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                            <input type="datetime-local" className="w-full px-4 py-3 rounded-xl border border-gray-200" {...register('end_time')} />
                            {errors.end_time && <p className="mt-1 text-sm text-red-500">{errors.end_time.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fotoğraflar</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="img-upload" />
                                <label htmlFor="img-upload" className="cursor-pointer text-gray-600">Fotoğraf yüklemek için tıklayın</label>
                            </div>
                            {imagePreview.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    {imagePreview.map((src, i) => (
                                        <div key={i} className="relative aspect-square">
                                            <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                                            <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}
                        <div className="flex gap-3">
                            <Link to="/admin/auctions" className="flex-1"><Button variant="outline" className="w-full" type="button">İptal</Button></Link>
                            <Button type="submit" className="flex-1" isLoading={isSubmitting}>Ürün Ekle</Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
