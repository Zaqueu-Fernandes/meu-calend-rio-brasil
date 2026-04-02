import { useEffect, useRef, useCallback } from 'react';
import { Evento } from './useEventos';
import { useToast } from './use-toast';

const STORAGE_KEY = 'alarmes_disparados';

function getDisparados(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function salvarDisparados(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

export function useAlarmes(eventos: Evento[]) {
  const { toast } = useToast();
  const disparadosRef = useRef<Set<string>>(getDisparados());
  const audioRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      // Close any previous context to avoid stacking
      if (audioRef.current) {
        audioRef.current.close().catch(() => {});
      }
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      osc.onended = () => {
        ctx.close().catch(() => {});
        audioRef.current = null;
      };
    } catch { /* silent fallback */ }
  }, []);

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
          salvarDisparados(disparadosRef.current);

          playSound();

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Alarme: ' + evento.titulo, {
              body: evento.descricao || `Evento às ${evento.horario || 'hoje'}`,
            });
          }

          toast({
            title: '⏰ Alarme!',
            description: evento.titulo,
          });
        }
      });
    };

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    verificar();
    const interval = setInterval(verificar, 15000);
    return () => clearInterval(interval);
  }, [eventos, toast, playSound]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.close().catch(() => {});
      }
    };
  }, []);
}
