-- Create patient_bank_accounts table for storing multiple bank accounts per patient
CREATE TABLE IF NOT EXISTS patient_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  iban TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by patient_id
CREATE INDEX IF NOT EXISTS idx_patient_bank_accounts_patient_id ON patient_bank_accounts(patient_id);

-- Enable RLS
ALTER TABLE patient_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_bank_accounts

-- Public can read bank accounts (needed for donation info display)
CREATE POLICY "Public can read patient bank accounts" ON patient_bank_accounts
  FOR SELECT USING (true);

-- Only authenticated users can insert bank accounts
CREATE POLICY "Authenticated can insert patient bank accounts" ON patient_bank_accounts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update bank accounts
CREATE POLICY "Authenticated can update patient bank accounts" ON patient_bank_accounts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete bank accounts
CREATE POLICY "Authenticated can delete patient bank accounts" ON patient_bank_accounts
  FOR DELETE USING (auth.role() = 'authenticated');
