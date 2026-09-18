"use client";
let context: AudioContext | undefined;
export function sound(enabled: boolean, tone: "click" | "add" = "click") {
  if (!enabled || typeof window === "undefined") return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      tone === "add" ? 620 : 220,
      context.currentTime,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      tone === "add" ? 920 : 90,
      context.currentTime + 0.07,
    );
    volume.gain.setValueAtTime(0.025, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => {
      oscillator.disconnect();
      volume.disconnect();
    };
  } catch {
    /* Browsers that cannot play audio retain every shopping feature. */
  }
}
