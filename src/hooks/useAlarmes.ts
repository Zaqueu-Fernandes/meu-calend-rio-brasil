import { useState, useEffect, useRef, useCallback } from 'react';
import { Evento } from './useEventos';
import { useToast } from './use-toast';
import { requestAlarmNotificationPermission, unlockAlarmAudio } from '@/lib/alarmCapabilities';

const STORAGE_KEY = 'alarmes_disparados';
const CHECK_INTERVAL_MS = 1000;
const MAX_LATE_TRIGGER_MS = 60 * 1000;
const BEEP_INTERVAL_MS = 1200;

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
    if (idsAtivos.has(id)) {
      novoSet.add(id);
    }
  });
  return novoSet;
}

export interface AlarmeAtivo {
  evento: Evento;
}

export function useAlarmes(eventos: Evento[]) {
  const { toast } = useToast();
  const disparadosRef = useRef<Set<string>>(getDisparados());
  const audioRef = useRef<AudioContext | null>(null);
  const eventosRef = useRef<Evento[]>(eventos);
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [alarmesAtivos, setAlarmesAtivos] = useState<AlarmeAtivo[]>([]);

  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  const prepareAlarmCapabilities = useCallback(async () => {
    audioRef.current = await unlockAlarmAudio(audioRef.current);
    await requestAlarmNotificationPermission();
  }, []);

  const playBeep = useCallback(async () => {
    try {
      audioRef.current = await unlockAlarmAudio(audioRef.current);
      const ctx = audioRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startAt = ctx.currentTime;
      // Two-tone beep for urgency
      osc.frequency.setValueAtTime(880, startAt);
      osc.frequency.setValueAtTime(660, startAt + 0.15);
      osc.frequency.setValueAtTime(880, startAt + 0.3);
      osc.type = 'square';

      gain.gain.cancelScheduledValues(startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.3, startAt + 0.02);
      gain.gain.setValueAtTime(0.3, startAt + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.5);

      osc.start(startAt);
      osc.stop(startAt + 0.5);
    } catch { /* silent fallback */ }
  }, []);

  const startContinuousAlarm = useCallback(() => {
    // Stop any existing loop
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
    }
    // Play immediately then repeat
    void playBeep();
    beepIntervalRef.current = setInterval(() => {
      void playBeep();
    }, BEEP_INTERVAL_MS);
  }, [playBeep]);

  const stopContinuousAlarm = useCallback(() => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  }, []);

  const dismissAlarme = useCallback((eventoId: string) => {
    setAlarmesAtivos(prev => {
      const next = prev.filter(a => a.evento.id !== eventoId);
      if (next.length === 0) {
        stopContinuousAlarm();
      }
      return next;
    });
  }, [stopContinuousAlarm]);

  const dismissAll = useCallback(() => {
    setAlarmesAtivos([]);
    stopContinuousAlarm();
  }, [stopContinuousAlarm]);

  const dispararAlarme = useCallback((evento: Evento) => {
    disparadosRef.current.add(evento.id);
    salvarDisparados(disparadosRef.current);

    // Add to active alarms and start continuous sound
    setAlarmesAtivos(prev => {
      const alreadyActive = prev.some(a => a.evento.id === evento.id);
      if (alreadyActive) return prev;
      return [...prev, { evento }];
    });
    startContinuousAlarm();

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ Alarme: ' + evento.titulo, {
          body: evento.descricao || `Evento às ${evento.horario || 'hoje'}`,
          requireInteraction: true,
        });
      } catch { /* ignore */ }
    }

    toast({
      title: '⏰ Alarme!',
      description: evento.titulo,
      duration: 10000,
    });
  }, [startContinuousAlarm, toast]);

  // Prepare alarm capabilities on any user interaction
  useEffect(() => {
    const prepare = () => {
      void prepareAlarmCapabilities();
    };
    window.addEventListener('pointerdown', prepare, { passive: true });
    window.addEventListener('keydown', prepare);
    window.addEventListener('touchstart', prepare, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', prepare);
      window.removeEventListener('keydown', prepare);
      window.removeEventListener('touchstart', prepare);
    };
  }, [prepareAlarmCapabilities]);

  // Clean up old dispatched alarms when eventos change
  useEffect(() => {
    if (eventos.length > 0) {
      const limpo = limparAntigos(disparadosRef.current, eventos);
      disparadosRef.current = limpo;
      salvarDisparados(limpo);
    }
  }, [eventos]);

  // Main alarm checking effect
  useEffect(() => {
    const verificar = () => {
      const agora = new Date();
      const eventosAtuais = eventosRef.current;

      eventosAtuais.forEach((evento) => {
        if (!evento.alarme) return;
        if (disparadosRef.current.has(evento.id)) return;

        const alarmeDate = new Date(evento.alarme);
        if (isNaN(alarmeDate.getTime())) return;

        const diff = agora.getTime() - alarmeDate.getTime();

        if (diff >= 0 && diff <= MAX_LATE_TRIGGER_MS) {
          dispararAlarme(evento);
        } else if (diff > MAX_LATE_TRIGGER_MS) {
          disparadosRef.current.add(evento.id);
          salvarDisparados(disparadosRef.current);
        }
      });
    };

    verificar();
    const interval = setInterval(verificar, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispararAlarme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousAlarm();
      if (audioRef.current) {
        try { audioRef.current.close(); } catch { /* ignore */ }
        audioRef.current = null;
      }
    };
  }, [stopContinuousAlarm]);

  return { alarmesAtivos, dismissAlarme, dismissAll };
}
