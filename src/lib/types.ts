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

export interface Patient {
    id: string
    full_name: string
    description: string | null
    social_instagram: string | null
    social_twitter: string | null
    social_facebook: string | null
    social_tiktok: string | null
    document_governorship: string | null
    document_gene_report: string | null
    document_hospital_proposal: string | null
    document_medical_report: string | null
    photo_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
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
