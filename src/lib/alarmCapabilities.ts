type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function getAudioContextConstructor() {
  if (typeof window === 'undefined') return null;

  return window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext ?? null;
}

export async function unlockAlarmAudio(existingContext?: AudioContext | null): Promise<AudioContext | null> {
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) return null;

  const context = existingContext && existingContext.state !== 'closed'
    ? existingContext
    : new AudioContextConstructor();

  try {
    if (context.state === 'suspended') {
      await context.resume();
    }

    const gain = context.createGain();
    const oscillator = context.createOscillator();

    gain.gain.setValueAtTime(0.00001, context.currentTime);
    oscillator.frequency.setValueAtTime(1, context.currentTime);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.01);
  } catch {
    return context;
  }

  return context;
}

export async function requestAlarmNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}