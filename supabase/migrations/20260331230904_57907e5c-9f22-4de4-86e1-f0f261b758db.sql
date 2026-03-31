
-- Add anexo_url and alarme columns to eventos
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS anexo_url text DEFAULT NULL;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS alarme timestamp with time zone DEFAULT NULL;

-- Create storage bucket for event attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('event-attachments', 'event-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage: users can manage their own attachments
CREATE POLICY "Users can upload event attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own event attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own event attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
