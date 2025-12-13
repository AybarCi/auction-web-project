import { useState } from 'react'
import { motion } from 'framer-motion'

interface ImageGalleryProps {
    images: string[]
    title: string
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <motion.div
                className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg"
                layoutId="main-image"
            >
                <motion.img
                    key={selectedIndex}
                    src={images[selectedIndex]}
                    alt={`${title} - Görsel ${selectedIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        >
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        >
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                    {selectedIndex + 1} / {images.length}
                </div>
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedIndex
                                    ? 'border-primary-500 ring-2 ring-primary-200'
                                    : 'border-transparent hover:border-gray-300'
                                }`}
                        >
                            <img
                                src={image}
                                alt={`${title} - Küçük görsel ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
