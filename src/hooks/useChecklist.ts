import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ChecklistItem {
  id: string;
  evento_id: string;
  user_id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
  created_at: string;
}

export function useChecklist(eventoId: string | null) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const carregarItems = useCallback(async () => {
    if (!user || !eventoId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('evento_id', eventoId)
      .order('ordem')
      .order('created_at');
    if (error) {
      toast({ title: 'Erro ao carregar checklist', description: error.message, variant: 'destructive' });
    } else {
      setItems(data as ChecklistItem[]);
    }
    setLoading(false);
  }, [user, eventoId, toast]);

  useEffect(() => {
    carregarItems();
  }, [carregarItems]);

  const adicionarItem = async (texto: string) => {
    if (!user || !eventoId) return;
    const ordem = items.length;
    const { error } = await supabase.from('checklist_items').insert({
      evento_id: eventoId,
      user_id: user.id,
      texto,
      ordem,
    });
    if (error) {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    } else {
      carregarItems();
    }
  };

  const toggleItem = async (id: string, concluido: boolean) => {
    const { error } = await supabase.from('checklist_items').update({ concluido }).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, concluido } : i));
    }
  };

  const removerItem = async (id: string) => {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao remover item', description: error.message, variant: 'destructive' });
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return { items, loading, adicionarItem, toggleItem, removerItem, carregarItems };
}
