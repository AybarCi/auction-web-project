import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Auction, Bid } from '../lib/types'

interface AuctionContextType {
    activeAuction: Auction | null
    highestBid: Bid | null
    bidCount: number
    isLoading: boolean
    error: string | null
    refreshAuction: () => Promise<void>
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined)

export function AuctionProvider({ children }: { children: ReactNode }) {
    const [activeAuction, setActiveAuction] = useState<Auction | null>(null)
    const [highestBid, setHighestBid] = useState<Bid | null>(null)
    const [bidCount, setBidCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchActiveAuction = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Fetch active auction
            const { data: auctions, error: auctionError } = await supabase
                .from('auctions')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)

            if (auctionError) throw auctionError

            if (auctions && auctions.length > 0) {
                const auction = auctions[0] as Auction
                setActiveAuction(auction)

                // Fetch highest bid for this auction
                const { data: bids, error: bidError } = await supabase
                    .from('bids')
                    .select('*')
                    .eq('auction_id', auction.id)
                    .order('bid_amount', { ascending: false })
                    .limit(1)

                if (bidError) throw bidError

                if (bids && bids.length > 0) {
                    setHighestBid(bids[0] as Bid)
                }

                // Get bid count
                const { count } = await supabase
                    .from('bids')
                    .select('*', { count: 'exact', head: true })
                    .eq('auction_id', auction.id)

                setBidCount(count || 0)
            } else {
                setActiveAuction(null)
                setHighestBid(null)
                setBidCount(0)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchActiveAuction()

        // Subscribe to realtime updates for bids
        const channel = supabase
            .channel('bids-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bids'
                },
                async (payload) => {
                    const newBid = payload.new as Bid

                    // Check if new bid is for active auction
                    if (activeAuction && newBid.auction_id === activeAuction.id) {
                        // Check if new bid is higher than current
                        if (!highestBid || newBid.bid_amount > highestBid.bid_amount) {
                            setHighestBid(newBid)
                        }
                        setBidCount(prev => prev + 1)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeAuction?.id])

    return (
        <AuctionContext.Provider
            value={{
                activeAuction,
                highestBid,
                bidCount,
                isLoading,
                error,
                refreshAuction: fetchActiveAuction
            }}
        >
            {children}
        </AuctionContext.Provider>
    )
}

export function useAuction() {
    const context = useContext(AuctionContext)
    if (context === undefined) {
        throw new Error('useAuction must be used within an AuctionProvider')
    }
    return context
}
