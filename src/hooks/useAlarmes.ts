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

// Clean old entries (older than 7 days) to prevent localStorage bloat
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

export function useAlarmes(eventos: Evento[]) {
  const { toast } = useToast();
  const disparadosRef = useRef<Set<string>>(getDisparados());
  const audioRef = useRef<AudioContext | null>(null);
  const eventosRef = useRef<Evento[]>(eventos);

  // Keep eventosRef in sync
  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  const playSound = useCallback(() => {
    try {
      // Close any previous context to avoid stacking
      if (audioRef.current) {
        try { audioRef.current.close(); } catch { /* ignore */ }
        audioRef.current = null;
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
        try { ctx.close(); } catch { /* ignore */ }
        if (audioRef.current === ctx) {
          audioRef.current = null;
        }
      };
    } catch { /* silent fallback */ }
  }, []);

  const dispararAlarme = useCallback((evento: Evento) => {
    disparadosRef.current.add(evento.id);
    salvarDisparados(disparadosRef.current);

    // Play sound
    playSound();

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ Alarme: ' + evento.titulo, {
          body: evento.descricao || `Evento às ${evento.horario || 'hoje'}`,
        });
      } catch { /* ignore */ }
    }

    // Toast notification
    toast({
      title: '⏰ Alarme!',
      description: evento.titulo,
      duration: 10000,
    });
  }, [playSound, toast]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
        if (isNaN(alarmeDate.getTime())) return; // Invalid date guard
        
        if (agora.getTime() >= alarmeDate.getTime()) {
          dispararAlarme(evento);
        }
      });
    };

    // Check immediately
    verificar();
    
    // Then check every 5 seconds for more responsive alarms
    const interval = setInterval(verificar, 5000);
    return () => clearInterval(interval);
  }, [dispararAlarme]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.close(); } catch { /* ignore */ }
        audioRef.current = null;
      }
    };
  }, []);
}
