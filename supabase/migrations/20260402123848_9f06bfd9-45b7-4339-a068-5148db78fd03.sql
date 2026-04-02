-- Fix eventos policies: drop public, recreate for authenticated
DROP POLICY IF EXISTS "Users can delete their own eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can insert their own eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can update their own eventos" ON public.eventos;
DROP POLICY IF EXISTS "Users can view their own eventos" ON public.eventos;

CREATE POLICY "Users can view their own eventos" ON public.eventos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own eventos" ON public.eventos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own eventos" ON public.eventos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own eventos" ON public.eventos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix profiles policies: drop public, recreate for authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);