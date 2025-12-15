-- Create patients table for SMA patient information
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  description TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_facebook TEXT,
  social_tiktok TEXT,
  document_governorship TEXT,
  document_gene_report TEXT,
  document_hospital_proposal TEXT,
  document_medical_report TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "Public can read patients" ON patients
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert patients" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update patients" ON patients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete patients" ON patients
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient documents
CREATE POLICY "Public can view patient documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-documents');

CREATE POLICY "Authenticated can upload patient documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update patient documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'patient-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete patient documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-documents' AND auth.role() = 'authenticated');
