"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function cleanForSpeech(text: string) {
  const t = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_#`>|]/g, "")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= 340) return t;
  const cut = t.slice(0, 340);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return (end > 120 ? cut.slice(0, end + 1) : cut) + " O resto está na tela.";
}

/** Fala em português pelo próprio navegador (grátis). */
export function speak(text: string, cb?: { onStart?: () => void; onEnd?: () => void }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return cb?.onEnd?.();
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
  u.lang = "pt-BR";
  u.rate = 1.06;
  const voices = synth.getVoices().filter((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("pt-br"));
  const pick = voices.find((v) => /google|natural|luciana|francisca/i.test(v.name)) ?? voices[0];
  if (pick) u.voice = pick;
  u.onstart = () => cb?.onStart?.();
  u.onend = () => cb?.onEnd?.();
  u.onerror = () => cb?.onEnd?.();
  synth.speak(u);
}

let current: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Voz natural (ElevenLabs ou LMNT pelo servidor); se não houver chave ou saldo, cai na voz do navegador. */
export async function speakNatural(text: string, natural: boolean, cb?: { onStart?: () => void; onEnd?: () => void }) {
  stopSpeaking();
  if (natural) {
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: cleanForSpeech(text) }) });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        const a = new Audio(url);
        current = a;
        const done = () => {
          URL.revokeObjectURL(url);
          if (current === a) current = null;
          cb?.onEnd?.();
        };
        a.onplay = () => cb?.onStart?.();
        a.onended = done;
        a.onerror = done;
        a.onpause = () => current !== a && done();
        await a.play();
        return;
      }
    } catch {
      /* cai na voz do navegador */
    }
  }
  speak(text, cb);
}

/**
 * Microfone: usa o reconhecimento de fala do navegador quando existe (Chrome, Android);
 * senão grava e transcreve pelo Whisper do Groq (iPhone e outros).
 */
export function useVoice(onFinal: (text: string) => void, onError?: (msg: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [working, setWorking] = useState(false);
  const rec = useRef<any>(null);
  const media = useRef<{ stream: MediaStream; recorder: MediaRecorder; ctx: AudioContext; raf: number } | null>(null);
  const finalText = useRef("");
  const cb = useRef({ onFinal, onError });
  cb.current = { onFinal, onError };

  const stop = useCallback(() => {
    try {
      rec.current?.stop();
    } catch {}
    if (media.current && media.current.recorder.state !== "inactive") media.current.recorder.stop();
  }, []);

  const startBrowser = (SR: any) => {
    const r = new SR();
    rec.current = r;
    finalText.current = "";
    r.lang = "pt-BR";
    r.interimResults = true;
    r.continuous = false;
    let pulse: ReturnType<typeof setTimeout>;
    r.onresult = (e: any) => {
      let int = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText.current += t;
        else int += t;
      }
      setInterim((finalText.current + " " + int).trim());
      setLevel(0.9);
      clearTimeout(pulse);
      pulse = setTimeout(() => setLevel(0.2), 220);
    };
    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") cb.current.onError?.("Libere o microfone para este site no navegador.");
      else if (e.error !== "no-speech" && e.error !== "aborted") cb.current.onError?.("Não consegui ouvir. Tenta de novo.");
    };
    r.onend = () => {
      setListening(false);
      setLevel(0);
      const t = finalText.current.trim();
      setInterim("");
      if (t) cb.current.onFinal(t);
    };
    r.start();
    setListening(true);
    setLevel(0.2);
  };

  const startRecorder = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    let heard = false;
    let quiet = 0;
    const started = Date.now();
    const tick = () => {
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += (v - 128) * (v - 128);
      const rms = Math.sqrt(sum / buf.length) / 128;
      setLevel(Math.min(1, rms * 6));
      if (rms > 0.04) {
        heard = true;
        quiet = 0;
      } else quiet++;
      // para sozinho: 1,5 s de silêncio depois de ouvir fala, ou 20 s no total
      if ((heard && quiet > 90) || Date.now() - started > 20000) recorder.state !== "inactive" && recorder.stop();
      else if (media.current) media.current.raf = requestAnimationFrame(tick);
    };
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      cancelAnimationFrame(media.current?.raf ?? 0);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => null);
      media.current = null;
      setListening(false);
      setLevel(0);
      if (!heard) return;
      setWorking(true);
      try {
        const type = recorder.mimeType || "audio/webm";
        const fd = new FormData();
        fd.append("audio", new Blob(chunks, { type }), type.includes("mp4") ? "fala.mp4" : "fala.webm");
        const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "erro");
        if (j.text?.trim()) cb.current.onFinal(j.text.trim());
      } catch (e) {
        cb.current.onError?.(e instanceof Error ? e.message : "Não consegui transcrever.");
      } finally {
        setWorking(false);
      }
    };
    media.current = { stream, recorder, ctx, raf: requestAnimationFrame(tick) };
    recorder.start();
    setListening(true);
  };

  const start = useCallback(async () => {
    stopSpeaking();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      if (SR) startBrowser(SR);
      else if ("mediaDevices" in navigator && typeof MediaRecorder !== "undefined") await startRecorder();
      else cb.current.onError?.("Este navegador não tem microfone disponível. Digite a mensagem.");
    } catch {
      setListening(false);
      cb.current.onError?.("Libere o microfone para este site no navegador.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stop(), [stop]);

  return { listening, interim, level, working, start, stop, toggle: () => (listening ? stop() : start()) };
}
