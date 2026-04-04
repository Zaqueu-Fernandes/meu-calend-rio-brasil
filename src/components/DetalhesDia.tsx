import { useState } from 'react';
import { formatarData } from '@/lib/calendario';
import { getFeriadoDoDia, Feriado } from '@/lib/feriados';
import { getFaseLua } from '@/lib/lua';
import { Evento } from '@/hooks/useEventos';
import { Categoria } from '@/hooks/useCategorias';
import { useChecklist } from '@/hooks/useChecklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Clock, Moon, Flag, Pencil, Paperclip, AlarmClock, Tag, CheckSquare, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChecklistPanel from './ChecklistPanel';

interface DetalhesDiaProps {
  data: Date;
  feriados: Feriado[];
  eventos: Evento[];
  categorias?: Categoria[];
  onNovoEvento: () => void;
  onExcluirEvento: (id: string) => void;
  onEditarEvento: (evento: Evento) => void;
  onDuplicarEvento?: (evento: Evento) => void;
  onMeusEventos?: () => void;
}

const EventoCard = ({ evento, categorias = [], onEditar, onExcluir, onDuplicar }: { evento: Evento; categorias?: Categoria[]; onEditar: () => void; onExcluir: () => void; onDuplicar?: () => void }) => {
  const [showChecklist, setShowChecklist] = useState(false);
  const { items, loading, adicionarItem, toggleItem, removerItem } = useChecklist(showChecklist ? evento.id : null);
  const categoria = categorias.find(c => c.id === (evento as any).categoria_id);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: evento.cor }}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground">{evento.titulo}</p>
            {categoria && (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full mt-0.5" style={{ backgroundColor: categoria.cor + '20', color: categoria.cor }}>
                <Tag className="w-2.5 h-2.5" /> {categoria.nome}
              </span>
            )}
            {evento.descricao && (
              <p className="text-sm text-muted-foreground">{evento.descricao}</p>
            )}
            {evento.horario && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> {evento.horario.slice(0, 5)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {evento.anexo_url && (
                <span className="text-xs text-primary flex items-center gap-0.5">
                  <Paperclip className="w-3 h-3" /> Anexo
                </span>
              )}
              {evento.alarme && (
                <span className="text-xs text-primary flex items-center gap-0.5">
                  <AlarmClock className="w-3 h-3" /> {new Date(evento.alarme).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setShowChecklist(!showChecklist)} className={`h-8 w-8 ${showChecklist ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              <CheckSquare className="w-4 h-4" />
            </Button>
            {onDuplicar && (
              <Button variant="ghost" size="icon" onClick={onDuplicar} className="text-muted-foreground hover:text-primary h-8 w-8" title="Duplicar evento">
                <Copy className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onEditar} className="text-muted-foreground hover:text-primary h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onExcluir} className="text-destructive hover:text-destructive h-8 w-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {showChecklist && (
          <div className="mt-3 pt-3 border-t border-border">
            <ChecklistPanel items={items} loading={loading} onAdicionar={adicionarItem} onToggle={toggleItem} onRemover={removerItem} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DetalhesDia = ({ data, feriados, eventos, categorias = [], onNovoEvento, onExcluirEvento, onEditarEvento, onDuplicarEvento, onMeusEventos }: DetalhesDiaProps) => {
  const feriado = getFeriadoDoDia(data, feriados);
  const lua = getFaseLua(data);
  const dataStr = data.toISOString().split('T')[0];
  const eventosDoDia = eventos.filter(e => e.data === dataStr);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={dataStr} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold capitalize text-foreground">{formatarData(data)}</h2>
        </div>

        {/* Fase da Lua */}
        <Card className="border-2 border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Moon className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl">{lua.emoji}</span>
            <div>
              <p className="font-semibold text-card-foreground">{lua.nome}</p>
              <p className="text-sm text-muted-foreground">Iluminação: {lua.iluminacao}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Feriado */}
        {feriado && (
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <Flag className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-card-foreground">{feriado.nome}</p>
                <p className="text-sm text-muted-foreground">Feriado {feriado.tipo === 'fixo' ? 'fixo' : 'móvel'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eventos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Meus Eventos</h3>
            <Button size="sm" onClick={onNovoEvento} className="gap-1">
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>

          {eventosDoDia.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Nenhum evento neste dia</p>
          ) : (
            <div className="space-y-2">
              {eventosDoDia.map(evento => (
                <EventoCard
                  key={evento.id}
                  evento={evento}
                  categorias={categorias}
                  onEditar={() => onEditarEvento(evento)}
                  onExcluir={() => onExcluirEvento(evento.id)}
                  onDuplicar={onDuplicarEvento ? () => onDuplicarEvento(evento) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DetalhesDia;
