-- Categories table
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categorias" ON public.categorias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categorias" ON public.categorias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categorias" ON public.categorias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categorias" ON public.categorias FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add categoria_id to eventos
ALTER TABLE public.eventos ADD COLUMN categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL;

-- Checklist items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  texto TEXT NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own checklist items" ON public.checklist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklist items" ON public.checklist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklist items" ON public.checklist_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklist items" ON public.checklist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);