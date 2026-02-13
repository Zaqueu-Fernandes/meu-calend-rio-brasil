import { getDiasDoMes, DIAS_SEMANA, isHoje } from '@/lib/calendario';
import { getFeriadoDoDia, Feriado } from '@/lib/feriados';
import { getFaseLua } from '@/lib/lua';
import { Evento } from '@/hooks/useEventos';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CalendarioGridProps {
  ano: number;
  mes: number;
  feriados: Feriado[];
  eventos: Evento[];
  diaSelecionado: Date | null;
  onSelectDia: (data: Date) => void;
}

const CalendarioGrid = ({ ano, mes, feriados, eventos, diaSelecionado, onSelectDia }: CalendarioGridProps) => {
  const dias = getDiasDoMes(ano, mes);

  const temEvento = (data: Date): boolean => {
    const dataStr = data.toISOString().split('T')[0];
    return eventos.some(e => e.data === dataStr);
  };

  const isSelecionado = (data: Date): boolean => {
    if (!diaSelecionado) return false;
    return data.getDate() === diaSelecionado.getDate() &&
      data.getMonth() === diaSelecionado.getMonth() &&
      data.getFullYear() === diaSelecionado.getFullYear();
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className="text-center text-sm font-bold text-muted-foreground py-2">
            {dia}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dias.map((data, i) => {
          if (!data) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const feriado = getFeriadoDoDia(data, feriados);
          const lua = getFaseLua(data);
          const hoje = isHoje(data);
          const selecionado = isSelecionado(data);
          const eventosDia = temEvento(data);
          const isDomingo = data.getDay() === 0;

          return (
            <motion.button
              key={data.toISOString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDia(data)}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm font-semibold transition-all relative p-1',
                hoje && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                selecionado && 'bg-primary text-primary-foreground shadow-lg',
                !selecionado && feriado && 'bg-destructive/10 text-destructive',
                !selecionado && !feriado && isDomingo && 'text-destructive/70',
                !selecionado && !feriado && !isDomingo && 'hover:bg-muted',
              )}
            >
              <span className="text-xs leading-none">{data.getDate()}</span>
              <span className="text-[10px] leading-none opacity-70">{lua.emoji}</span>
              {eventosDia && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              {feriado && !selecionado && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-destructive" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarioGrid;
