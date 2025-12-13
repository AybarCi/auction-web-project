import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    endTime: string
    onEnd?: () => void
}

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

export default function CountdownTimer({ endTime, onEnd }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [isEnded, setIsEnded] = useState(false)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(endTime).getTime() - new Date().getTime()

            if (difference <= 0) {
                setIsEnded(true)
                onEnd?.()
                return { days: 0, hours: 0, minutes: 0, seconds: 0 }
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            }
        }

        setTimeLeft(calculateTimeLeft())

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(timer)
    }, [endTime, onEnd])

    if (isEnded) {
        return (
            <div className="text-center">
                <p className="text-red-500 font-bold text-xl">Açık Artırma Sona Erdi</p>
            </div>
        )
    }

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-bold font-mono">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">{label}</span>
        </div>
    )

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4">
            <TimeBlock value={timeLeft.days} label="Gün" />
            <span className="text-2xl text-primary-500 font-bold">:</span>
            <TimeBlock value={timeLeft.hours} label="Saat" />
            <span className="text-2xl text-primary-500 font-bold">:</span>
            <TimeBlock value={timeLeft.minutes} label="Dakika" />
            <span className="text-2xl text-primary-500 font-bold">:</span>
            <TimeBlock value={timeLeft.seconds} label="Saniye" />
        </div>
    )
}
