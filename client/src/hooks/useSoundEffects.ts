/**
 * useSoundEffects — Ultra Premium sound feedback hook
 * Provides subtle audio feedback for interactions
 */
import { useCallback, useRef } from "react";

const audioCtxRef = { current: null as AudioContext | null };

function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, volume: number = 0.03, type: OscillatorType = "sine") {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail
  }
}

export function useSoundEffects() {
  const enabled = useRef(true);

  const playClick = useCallback(() => {
    if (!enabled.current) return;
    playTone(800, 0.08, 0.02, "sine");
  }, []);

  const playHover = useCallback(() => {
    if (!enabled.current) return;
    playTone(600, 0.05, 0.01, "sine");
  }, []);

  const playSuccess = useCallback(() => {
    if (!enabled.current) return;
    playTone(523, 0.1, 0.02, "sine");
    setTimeout(() => playTone(659, 0.1, 0.02, "sine"), 100);
    setTimeout(() => playTone(784, 0.15, 0.02, "sine"), 200);
  }, []);

  const playError = useCallback(() => {
    if (!enabled.current) return;
    playTone(300, 0.15, 0.02, "sawtooth");
    setTimeout(() => playTone(250, 0.2, 0.02, "sawtooth"), 150);
  }, []);

  const playNotification = useCallback(() => {
    if (!enabled.current) return;
    playTone(880, 0.08, 0.02, "sine");
    setTimeout(() => playTone(1100, 0.12, 0.02, "sine"), 100);
  }, []);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
  }, []);

  return {
    playClick,
    playHover,
    playSuccess,
    playError,
    playNotification,
    toggle,
    isEnabled: enabled.current,
  };
}
