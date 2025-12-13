-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  min_bid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_urls TEXT[] DEFAULT '{}',
  winner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  bid_amount NUMERIC(10,2) NOT NULL,
  bidder_name TEXT NOT NULL,
  bidder_phone TEXT NOT NULL,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for winner after bids table exists
ALTER TABLE auctions 
ADD CONSTRAINT fk_winner 
FOREIGN KEY (winner_id) REFERENCES bids(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auctions
CREATE POLICY "Public can read auctions" ON auctions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert auctions" ON auctions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update auctions" ON auctions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete auctions" ON auctions
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for bids
CREATE POLICY "Anyone can insert bids" ON bids
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read highest bid" ON bids
  FOR SELECT USING (
    bid_amount = (
      SELECT MAX(b.bid_amount) FROM bids b WHERE b.auction_id = bids.auction_id
    )
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated can update bids" ON bids
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Bid validation function
CREATE OR REPLACE FUNCTION check_bid_amount()
RETURNS TRIGGER AS $$
DECLARE
  current_max NUMERIC;
  min_amount NUMERIC;
  auction_end TIMESTAMPTZ;
  auction_active BOOLEAN;
BEGIN
  SELECT min_bid_amount, end_time, is_active 
  INTO min_amount, auction_end, auction_active
  FROM auctions WHERE id = NEW.auction_id;
  
  IF NOT auction_active OR auction_end < now() THEN
    RAISE EXCEPTION 'Bu açık artırma sona ermiştir';
  END IF;
  
  SELECT COALESCE(MAX(bid_amount), 0) INTO current_max
  FROM bids WHERE auction_id = NEW.auction_id;
  
  IF current_max > 0 AND NEW.bid_amount <= current_max THEN
    RAISE EXCEPTION 'Teklif mevcut en yüksek tekliften yüksek olmalıdır';
  ELSIF current_max = 0 AND NEW.bid_amount < min_amount THEN
    RAISE EXCEPTION 'Teklif minimum tutardan düşük olamaz';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS validate_bid ON bids;
CREATE TRIGGER validate_bid
  BEFORE INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION check_bid_amount();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
