import { AlarmeAtivo } from '@/hooks/useAlarmes';
import { Button } from '@/components/ui/button';
import { AlarmClock, X, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlarmeOverlayProps {
  alarmesAtivos: AlarmeAtivo[];
  onDismiss: (eventoId: string) => void;
  onDismissAll: () => void;
}

const AlarmeOverlay = ({ alarmesAtivos, onDismiss, onDismissAll }: AlarmeOverlayProps) => {
  if (alarmesAtivos.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-sm mx-4 space-y-4"
        >
          {/* Pulsing alarm icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center"
            >
              <AlarmClock className="w-10 h-10 text-destructive" />
            </motion.div>
          </div>

          {/* Alarm cards */}
          <div className="space-y-2">
            {alarmesAtivos.map(({ evento }) => (
              <motion.div
                key={evento.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-card border-2 border-destructive/30 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{evento.titulo}</p>
                  {evento.horario && (
                    <p className="text-sm text-muted-foreground">
                      🕐 {evento.horario.slice(0, 5)}
                    </p>
                  )}
                  {evento.descricao && (
                    <p className="text-xs text-muted-foreground truncate">{evento.descricao}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDismiss(evento.id)}
                  className="shrink-0 border-destructive/30 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Dismiss all button */}
          <Button
            onClick={onDismissAll}
            className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            size="lg"
          >
            <BellOff className="w-5 h-5" />
            {alarmesAtivos.length > 1 ? 'Desativar Todos os Alarmes' : 'Desativar Alarme'}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlarmeOverlay;
