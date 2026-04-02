import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Evento {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  horario: string | null;
  cor: string;
  anexo_url: string | null;
  alarme: string | null;
  categoria_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useEventos(mesAtual: number, anoAtual: number) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const carregarEventos = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const inicio = new Date(anoAtual, mesAtual, 1).toISOString().split('T')[0];
    const fim = new Date(anoAtual, mesAtual + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .gte('data', inicio)
      .lte('data', fim)
      .order('data')
      .order('horario');

    if (error) {
      toast({ title: 'Erro ao carregar eventos', description: error.message, variant: 'destructive' });
    } else {
      setEventos(data as Evento[]);
    }
    setLoading(false);
  }, [user, mesAtual, anoAtual, toast]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  const criarEvento = async (evento: { titulo: string; descricao?: string; data: string; horario?: string; cor: string; anexo_url?: string; alarme?: string; categoria_id?: string }) => {
    if (!user) return;
    const { error } = await supabase.from('eventos').insert({
      ...evento,
      user_id: user.id,
    });
    if (error) {
      toast({ title: 'Erro ao criar evento', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Evento criado!' });
      carregarEventos();
    }
  };

  const atualizarEvento = async (id: string, evento: Partial<Evento>) => {
    const { error } = await supabase.from('eventos').update(evento).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar evento', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Evento atualizado!' });
      carregarEventos();
    }
  };

  const excluirEvento = async (id: string) => {
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir evento', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Evento excluído!' });
      carregarEventos();
    }
  };

  const uploadAnexo = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('event-attachments').upload(filePath, file);
    if (error) {
      toast({ title: 'Erro ao enviar arquivo', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data } = supabase.storage.from('event-attachments').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('event-attachments').createSignedUrl(filePath, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  const getEventosDoDia = (data: Date): Evento[] => {
    const dataStr = data.toISOString().split('T')[0];
    return eventos.filter(e => e.data === dataStr);
  };

  return { eventos, loading, criarEvento, atualizarEvento, excluirEvento, uploadAnexo, getSignedUrl, getEventosDoDia };
}
