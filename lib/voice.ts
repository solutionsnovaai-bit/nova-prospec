"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type VoiceSource = "fish" | "elevenlabs" | "browser";

const isIOS = () =>
  typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

function cleanForSpeech(text: string) {
  const t = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_#`>|]/g, "")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= 700) return t;
  const cut = t.slice(0, 700);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return (end > 200 ? cut.slice(0, end + 1) : cut) + " O resto está na tela.";
}

let player: HTMLAudioElement | null = null;
let actx: AudioContext | null = null;
let endCb: (() => void) | null = null;
let primed = false;
let synthPrimed = false;

/** WAV de silêncio (0,1 s) montado na hora, para "acordar" o áudio. */
function silentUrl() {
  const n = 800;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i);
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + n, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, "data");
  v.setUint32(40, n, true);
  b.fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
}

/**
 * Chamar DENTRO de um toque ou clique. O iPhone só toca som quando isso começa num gesto;
 * aqui o mesmo tocador é "acordado" com silêncio e depois reaproveitado para a fala.
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    if (!player) {
      player = new Audio();
      player.preload = "auto";
      player.setAttribute("playsinline", "");
    }
    if (!primed) {
      primed = true;
      player.src = silentUrl();
      player.play().catch((e) => {
        if (e?.name === "NotAllowedError") primed = false;
      });
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (AC) {
      actx = actx ?? new AC();
      if (actx!.state === "suspended") actx!.resume().catch(() => null);
    }
    if ("speechSynthesis" in window && !synthPrimed) {
      synthPrimed = true;
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch {
    /* segue sem áudio */
  }
}

/** Fala em português pela voz do próprio navegador (reserva). */
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

export function stopSpeaking() {
  if (player && !player.paused) player.pause();
  if (endCb) {
    const f = endCb;
    endCb = null;
    f();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Fala exclusivamente pela fonte escolhida. Erros são comunicados; sem mudança silenciosa de voz. */
export async function speakNatural(
  text: string,
  natural: boolean,
  cb?: { onStart?: () => void; onEnd?: () => void; onError?: (message: string) => void },
  voiceSource: VoiceSource = "fish",
) {
  stopSpeaking();
  unlockAudio();
  if (voiceSource === "browser") {
    speak(text, cb);
    return;
  }

  let url: string | null = null;
  let finished = false;
  const finish = (error?: string) => {
    if (finished) return;
    finished = true;
    if (url) URL.revokeObjectURL(url);
    if (endCb === stopCurrent) endCb = null;
    if (error) cb?.onError?.(error);
    cb?.onEnd?.();
  };
  const stopCurrent = () => finish();

  try {
    if (!natural) throw new Error(`A voz ${voiceSource === "fish" ? "Fish Audio" : "ElevenLabs"} não está configurada. Verifique Ajustes → Chaves.`);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanForSpeech(text), voiceSource }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(typeof detail.error === "string" ? detail.error : `Erro HTTP ${res.status} ao gerar áudio.`);
    }
    const provider = res.headers.get("x-voice");
    if (provider !== voiceSource) throw new Error(`A resposta veio de outra voz (${provider || "desconhecida"}). Nenhum áudio diferente foi reproduzido.`);
    const audio = await res.blob();
    if (!audio.size) throw new Error("A API retornou um áudio vazio.");
    url = URL.createObjectURL(audio);
    const a = player ?? (player = new Audio());
    a.onplaying = () => cb?.onStart?.();
    a.onended = () => finish();
    a.onerror = () => finish("O áudio foi gerado, mas o navegador não conseguiu reproduzi-lo.");
    endCb = stopCurrent;
    a.src = url;
    await a.play();
  } catch (e) {
    finish(e instanceof Error ? e.message : "Falha ao gerar ou reproduzir a voz escolhida.");
  }
}

/**
 * Microfone. No iPhone (Safari e Chrome) grava e transcreve pelo Whisper do Groq, que é o caminho confiável lá;
 * nos outros navegadores usa o reconhecimento de fala embutido, com a gravação como reserva.
 */
export function useVoice(onFinal: (text: string) => void, onError?: (msg: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [working, setWorking] = useState(false);
  const rec = useRef<any>(null);
  const media = useRef<{ recorder: MediaRecorder; raf: number } | null>(null);
  const finalText = useRef("");
  const lastInterim = useRef("");
  const manual = useRef(false);
  const cb = useRef({ onFinal, onError });
  cb.current = { onFinal, onError };

  const stop = useCallback(() => {
    manual.current = true;
    try {
      rec.current?.stop();
    } catch {}
    if (media.current && media.current.recorder.state !== "inactive") media.current.recorder.stop();
  }, []);

  const startBrowser = (SR: any) => {
    const r = new SR();
    rec.current = r;
    finalText.current = "";
    lastInterim.current = "";
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
      lastInterim.current = int;
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
      const t = (finalText.current || lastInterim.current).trim(); // alguns navegadores nunca marcam como final
      setInterim("");
      if (t) cb.current.onFinal(t);
    };
    r.start();
    setListening(true);
    setLevel(0.2);
  };

  const startRecorder = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const live = !!actx && actx.state === "running";
    const an = live ? actx!.createAnalyser() : null;
    const srcNode = live ? actx!.createMediaStreamSource(stream) : null;
    if (an && srcNode) {
      an.fftSize = 512;
      srcNode.connect(an);
    }
    const buf = new Uint8Array(512);
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    let heard = !live; // sem medidor de volume, confia no toque para encerrar
    let quiet = 0;
    const started = Date.now();
    const tick = () => {
      if (an) {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += (v - 128) * (v - 128);
        const rms = Math.sqrt(sum / buf.length) / 128;
        setLevel(Math.min(1, rms * 6));
        if (rms > 0.04) {
          heard = true;
          quiet = 0;
        } else quiet++;
      } else setLevel(0.5);
      const age = Date.now() - started;
      // para sozinho: 1,3 s de silêncio depois da fala; 7 s sem ouvir nada; ou 20 s no total
      if ((an && heard && quiet > 80) || (an && !heard && age > 7000) || age > 20000) recorder.state !== "inactive" && recorder.stop();
      else if (media.current) media.current.raf = requestAnimationFrame(tick);
    };
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      cancelAnimationFrame(media.current?.raf ?? 0);
      stream.getTracks().forEach((t) => t.stop());
      try {
        srcNode?.disconnect();
      } catch {}
      media.current = null;
      setListening(false);
      setLevel(0);
      if (!heard && !manual.current) return cb.current.onError?.("Não ouvi nada. Toque no orbe e fale de novo.");
      setWorking(true);
      try {
        const type = recorder.mimeType || chunks[0]?.type || "audio/mp4";
        const fd = new FormData();
        fd.append("audio", new Blob(chunks, { type }), /webm/.test(type) ? "fala.webm" : /ogg/.test(type) ? "fala.ogg" : "fala.mp4");
        const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "erro");
        if (j.text?.trim()) cb.current.onFinal(j.text.trim());
        else cb.current.onError?.("Não entendi o áudio. Fala de novo?");
      } catch (e) {
        cb.current.onError?.(e instanceof Error ? e.message : "Não consegui transcrever.");
      } finally {
        setWorking(false);
      }
    };
    media.current = { recorder, raf: requestAnimationFrame(tick) };
    recorder.start();
    setListening(true);
  };

  const start = useCallback(async () => {
    stopSpeaking();
    unlockAudio(); // ainda dentro do toque
    manual.current = false;
    const SR = !isIOS() && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const canRecord = "mediaDevices" in navigator && typeof MediaRecorder !== "undefined";
    try {
      if (SR) startBrowser(SR);
      else if (canRecord) await startRecorder();
      else cb.current.onError?.("Este navegador não libera o microfone. Digite a mensagem.");
    } catch {
      setListening(false);
      cb.current.onError?.("Libere o microfone para este site nas permissões do navegador.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stop(), [stop]);

  return { listening, interim, level, working, start, stop, toggle: () => (listening ? stop() : start()) };
}
