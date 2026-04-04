import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Categoria } from '@/hooks/useCategorias';
import { Evento } from '@/hooks/useEventos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarSearch, Search, Calendar, Clock, Tag, ExternalLink } from 'lucide-react';
import { MESES } from '@/lib/calendario';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MeusEventosProps {
  categorias: Categoria[];
  onAbrirEvento?: (evento: Evento) => void;
}

const MeusEventos = ({ categorias, onAbrirEvento }: MeusEventosProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');
  const [mesFiltro, setMesFiltro] = useState('all');
  const [anoFiltro, setAnoFiltro] = useState('all');
  const [diaFiltro, setDiaFiltro] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: false })
        .order('horario', { ascending: false });
      setTodos((data as Evento[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, [open, user]);

  const anos = useMemo(() => {
    const set = new Set(todos.map(e => e.data.split('-')[0]));
    return Array.from(set).sort().reverse();
  }, [todos]);

  const filtrados = useMemo(() => {
    return todos.filter(e => {
      if (busca && !e.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
      if (categoriaFiltro !== 'all' && e.categoria_id !== categoriaFiltro) return false;
      const [ano, mes, dia] = e.data.split('-');
      if (anoFiltro !== 'all' && ano !== anoFiltro) return false;
      if (mesFiltro !== 'all' && String(parseInt(mes) - 1) !== mesFiltro) return false;
      if (diaFiltro && dia !== diaFiltro.padStart(2, '0')) return false;
      return true;
    });
  }, [todos, busca, categoriaFiltro, mesFiltro, anoFiltro, diaFiltro]);

  const getCategoriaNome = (id: string | null) => {
    if (!id) return null;
    const cat = categorias.find(c => c.id === id);
    return cat ? cat : null;
  };

  const formatData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <CalendarSearch className="w-4 h-4" /> <span className="hidden sm:inline">Meus Eventos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSearch className="w-5 h-5 text-primary" /> Meus Eventos
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categorias.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.cor }} />
                      {c.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={anoFiltro} onValueChange={setAnoFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos anos</SelectItem>
                {anos.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mesFiltro} onValueChange={setMesFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos meses</SelectItem>
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="Dia"
              value={diaFiltro}
              onChange={e => setDiaFiltro(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 space-y-2 mt-2 pr-1">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum evento encontrado.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{filtrados.length} evento(s)</p>
              {filtrados.map(e => {
                const cat = getCategoriaNome(e.categoria_id);
                return (
                  <Card key={e.id} className="border-l-4" style={{ borderLeftColor: e.cor }}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-card-foreground truncate">{e.titulo}</p>
                          {e.descricao && (
                            <p className="text-xs text-muted-foreground truncate">{e.descricao}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatData(e.data)}
                            </span>
                            {e.horario && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {e.horario.slice(0, 5)}
                              </span>
                            )}
                            {cat && (
                              <span className="text-xs flex items-center gap-1">
                                <Tag className="w-3 h-3" style={{ color: cat.cor }} />
                                <span className="text-muted-foreground">{cat.nome}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {onAbrirEvento && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 h-8 w-8 text-primary hover:text-primary/80"
                                  onClick={() => {
                                    onAbrirEvento(e);
                                    setOpen(false);
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Abrir Evento</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeusEventos;
