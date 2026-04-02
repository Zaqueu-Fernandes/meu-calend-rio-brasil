import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  created_at: string;
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const carregarCategorias = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');
    if (error) {
      toast({ title: 'Erro ao carregar categorias', description: error.message, variant: 'destructive' });
    } else {
      setCategorias(data as Categoria[]);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  const criarCategoria = async (nome: string, cor: string) => {
    if (!user) return;
    const { error } = await supabase.from('categorias').insert({ user_id: user.id, nome, cor });
    if (error) {
      toast({ title: 'Erro ao criar categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria criada!' });
      carregarCategorias();
    }
  };

  const atualizarCategoria = async (id: string, nome: string, cor: string) => {
    const { error } = await supabase.from('categorias').update({ nome, cor }).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria atualizada!' });
      carregarCategorias();
    }
  };

  const excluirCategoria = async (id: string) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria excluída!' });
      carregarCategorias();
    }
  };

  return { categorias, loading, criarCategoria, atualizarCategoria, excluirCategoria, carregarCategorias };
}
