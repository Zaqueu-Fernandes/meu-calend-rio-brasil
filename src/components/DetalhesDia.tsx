import { formatarData } from '@/lib/calendario';
import { getFeriadoDoDia, Feriado } from '@/lib/feriados';
import { getFaseLua } from '@/lib/lua';
import { Evento } from '@/hooks/useEventos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Clock, Moon, Flag, Pencil, Paperclip, AlarmClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetalhesDiaProps {
  data: Date;
  feriados: Feriado[];
  eventos: Evento[];
  onNovoEvento: () => void;
  onExcluirEvento: (id: string) => void;
  onEditarEvento: (evento: Evento) => void;
}

const DetalhesDia = ({ data, feriados, eventos, onNovoEvento, onExcluirEvento, onEditarEvento }: DetalhesDiaProps) => {
  const feriado = getFeriadoDoDia(data, feriados);
  const lua = getFaseLua(data);
  const dataStr = data.toISOString().split('T')[0];
  const eventosDoDia = eventos.filter(e => e.data === dataStr);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dataStr}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold capitalize text-foreground">
            {formatarData(data)}
          </h2>
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
                <p className="text-sm text-muted-foreground">
                  Feriado {feriado.tipo === 'fixo' ? 'fixo' : 'móvel'}
                </p>
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
            <p className="text-muted-foreground text-sm py-4 text-center">
              Nenhum evento neste dia
            </p>
          ) : (
            <div className="space-y-2">
              {eventosDoDia.map(evento => (
                <Card key={evento.id} className="border-l-4" style={{ borderLeftColor: evento.cor }}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-card-foreground">{evento.titulo}</p>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditarEvento(evento)}
                          className="text-muted-foreground hover:text-primary h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onExcluirEvento(evento.id)}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DetalhesDia;
