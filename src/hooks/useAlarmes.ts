import { useEffect, useRef } from 'react';
import { Evento } from './useEventos';
import { useToast } from './use-toast';

export function useAlarmes(eventos: Evento[]) {
  const { toast } = useToast();
  const disparadosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (eventos.length === 0) return;

    const verificar = () => {
      const agora = new Date();
      eventos.forEach((evento) => {
        if (!evento.alarme) return;
        if (disparadosRef.current.has(evento.id)) return;

        const alarmeDate = new Date(evento.alarme);
        if (agora >= alarmeDate) {
          disparadosRef.current.add(evento.id);

          // Play sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'square';
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
          } catch { /* silent fallback */ }

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Alarme: ' + evento.titulo, {
              body: evento.descricao || `Evento às ${evento.horario || 'hoje'}`,
            });
          }

          // Toast fallback
          toast({
            title: '⏰ Alarme!',
            description: evento.titulo,
          });
        }
      });
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    verificar();
    const interval = setInterval(verificar, 15000);
    return () => clearInterval(interval);
  }, [eventos, toast]);
}
