
-- Create the carteira_digital table
CREATE TABLE public.carteira_digital (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_carteira TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_validade TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'expirada', 'suspensa')),
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at_carteira_digital
  BEFORE UPDATE ON public.carteira_digital
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.carteira_digital ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own carteira digital" 
  ON public.carteira_digital 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own carteira digital" 
  ON public.carteira_digital 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own carteira digital" 
  ON public.carteira_digital 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carteira digital" 
  ON public.carteira_digital 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policy for public validation (read-only access to validate QR codes)
CREATE POLICY "Public can validate carteira by numero_carteira"
  ON public.carteira_digital
  FOR SELECT
  TO anon
  USING (status = 'ativa');
