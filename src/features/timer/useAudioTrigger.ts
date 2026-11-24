import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Microphone transient detector – fires when a sharp sound (padlock shackle snapping open)
 * exceeds the threshold. Uses an AnalyserNode on raw (unprocessed) mic input.
 */
export function useAudioTrigger(opts: { enabled: boolean; threshold: number; armed: boolean; onTrigger: () => void }) {
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<'off' | 'starting' | 'on' | 'denied' | 'unsupported'>('off');
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const peakHold = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    if (!opts.enabled) {
      stop();
      setStatus('off');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }
    let cancelled = false;
    setStatus('starting');
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1200; // ignore voices / table thumps, keep metallic clicks
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        src.connect(hp).connect(an);
        const buf = new Float32Array(an.fftSize);
        setStatus('on');
        let frame = 0;
        const loop = () => {
          an.getFloatTimeDomainData(buf);
          let peak = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = Math.abs(buf[i]);
            if (v > peak) peak = v;
          }
          const lvl = Math.min(1, Math.sqrt(peak) * 1.15);
          peakHold.current = Math.max(lvl, peakHold.current * 0.93);
          if (optsRef.current.armed && lvl >= optsRef.current.threshold) {
            optsRef.current.onTrigger();
          }
          if (++frame % 2 === 0) setLevel(peakHold.current);
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => !cancelled && setStatus('denied'));
    return () => {
      cancelled = true;
      stop();
    };
  }, [opts.enabled, stop]);

  return { level, status };
}
