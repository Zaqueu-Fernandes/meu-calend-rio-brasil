import { useState, useEffect, useRef, useCallback } from 'react';
import { Evento } from './useEventos';
import { useToast } from './use-toast';
import { requestAlarmNotificationPermission, unlockAlarmAudio } from '@/lib/alarmCapabilities';

const STORAGE_KEY = 'alarmes_disparados';
const CHECK_INTERVAL_MS = 1000;
const MAX_LATE_TRIGGER_MS = 60 * 1000;
const BEEP_INTERVAL_MS = 1200;

// Module-level variables to survive React re-renders
let globalBeepInterval: ReturnType<typeof setInterval> | null = null;
let globalAudioCtx: AudioContext | null = null;
let globalIsRinging = false;

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

function limparAntigos(set: Set<string>, eventos: Evento[]): Set<string> {
  const idsAtivos = new Set(eventos.map(e => e.id));
  const novoSet = new Set<string>();
  set.forEach(id => {
    if (idsAtivos.has(id)) novoSet.add(id);
  });
  return novoSet;
}

async function doBeep() {
  try {
    globalAudioCtx = await unlockAlarmAudio(globalAudioCtx);
    const ctx = globalAudioCtx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(660, t + 0.15);
    osc.frequency.setValueAtTime(880, t + 0.3);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.setValueAtTime(0.3, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.5);
  } catch { /* silent */ }
}

function startGlobalRinging() {
  if (globalIsRinging) return;
  globalIsRinging = true;
  void doBeep();
  globalBeepInterval = setInterval(() => {
    void doBeep();
  }, BEEP_INTERVAL_MS);
}

function stopGlobalRinging() {
  globalIsRinging = false;
  if (globalBeepInterval) {
    clearInterval(globalBeepInterval);
    globalBeepInterval = null;
  }
}

export interface AlarmeAtivo {
  evento: Evento;
}

export function useAlarmes(eventos: Evento[]) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const disparadosRef = useRef<Set<string>>(getDisparados());
  const eventosRef = useRef<Evento[]>(eventos);
  const [alarmesAtivos, setAlarmesAtivos] = useState<AlarmeAtivo[]>([]);

  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  // Prepare audio on user interaction
  useEffect(() => {
    const prepare = async () => {
      globalAudioCtx = await unlockAlarmAudio(globalAudioCtx);
      await requestAlarmNotificationPermission();
    };
    window.addEventListener('pointerdown', prepare, { passive: true });
    window.addEventListener('keydown', prepare);
    window.addEventListener('touchstart', prepare, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', prepare);
      window.removeEventListener('keydown', prepare);
      window.removeEventListener('touchstart', prepare);
    };
  }, []);

  const dismissAlarme = useCallback((eventoId: string) => {
    setAlarmesAtivos(prev => {
      const next = prev.filter(a => a.evento.id !== eventoId);
      if (next.length === 0) stopGlobalRinging();
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setAlarmesAtivos([]);
    stopGlobalRinging();
  }, []);

  // Clean up old dispatched alarms
  useEffect(() => {
    if (eventos.length > 0) {
      const limpo = limparAntigos(disparadosRef.current, eventos);
      disparadosRef.current = limpo;
      salvarDisparados(limpo);
    }
  }, [eventos]);

  // Main alarm checking - stable effect with no changing deps
  useEffect(() => {
    const verificar = () => {
      const agora = new Date();
      eventosRef.current.forEach((evento) => {
        if (!evento.alarme) return;
        if (disparadosRef.current.has(evento.id)) return;

        const alarmeDate = new Date(evento.alarme);
        if (isNaN(alarmeDate.getTime())) return;

        const diff = agora.getTime() - alarmeDate.getTime();

        if (diff >= 0 && diff <= MAX_LATE_TRIGGER_MS) {
          // Fire alarm
          disparadosRef.current.add(evento.id);
          salvarDisparados(disparadosRef.current);

          setAlarmesAtivos(prev => {
            if (prev.some(a => a.evento.id === evento.id)) return prev;
            return [...prev, { evento }];
          });

          startGlobalRinging();

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('⏰ Alarme: ' + evento.titulo, {
                body: evento.descricao || `Evento às ${evento.horario || 'hoje'}`,
                requireInteraction: true,
              });
            } catch { /* ignore */ }
          }

          toastRef.current({
            title: '⏰ Alarme!',
            description: evento.titulo,
            duration: 10000,
          });
        } else if (diff > MAX_LATE_TRIGGER_MS) {
          disparadosRef.current.add(evento.id);
          salvarDisparados(disparadosRef.current);
        }
      });
    };

    verificar();
    const interval = setInterval(verificar, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []); // Stable - no deps that change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGlobalRinging();
      if (globalAudioCtx) {
        try { globalAudioCtx.close(); } catch { /* ignore */ }
        globalAudioCtx = null;
      }
    };
  }, []);

  return { alarmesAtivos, dismissAlarme, dismissAll };
}
