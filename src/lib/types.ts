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
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    min_bid_amount: number
                    end_time: string
                    is_active?: boolean
                    image_urls?: string[]
                    winner_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    min_bid_amount?: number
                    end_time?: string
                    is_active?: boolean
                    image_urls?: string[]
                    winner_id?: string | null
                    updated_at?: string
                }
            }
            bids: {
                Row: Bid
                Insert: {
                    id?: string
                    auction_id: string
                    bid_amount: number
                    bidder_name: string
                    bidder_phone: string
                    is_winner?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    auction_id?: string
                    bid_amount?: number
                    bidder_name?: string
                    bidder_phone?: string
                    is_winner?: boolean
                }
            }
        }
    }
}
