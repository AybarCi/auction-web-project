-- Create storage bucket for auction images
INSERT INTO storage.buckets (id, name, public)
VALUES ('auction-images', 'auction-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view auction images"
ON storage.objects FOR SELECT
USING (bucket_id = 'auction-images');

CREATE POLICY "Authenticated can upload auction images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'auction-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update auction images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'auction-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete auction images"
ON storage.objects FOR DELETE
USING (bucket_id = 'auction-images' AND auth.role() = 'authenticated');
