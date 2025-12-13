export interface Auction {
    id: string
    title: string
    description: string | null
    min_bid_amount: number
    end_time: string
    is_active: boolean
    image_urls: string[]
    winner_id: string | null
    created_at: string
    updated_at: string
}

export interface Bid {
    id: string
    auction_id: string
    bid_amount: number
    bidder_name: string
    bidder_phone: string
    is_winner: boolean
    created_at: string
}

export interface Database {
    public: {
        Tables: {
            auctions: {
                Row: Auction
                Insert: Omit<Auction, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Auction, 'id' | 'created_at' | 'updated_at'>>
            }
            bids: {
                Row: Bid
                Insert: Omit<Bid, 'id' | 'created_at' | 'is_winner'>
                Update: Partial<Omit<Bid, 'id' | 'created_at'>>
            }
        }
    }
}

export type AuctionWithBids = Auction & {
    highest_bid?: Bid | null
    bid_count?: number
}
