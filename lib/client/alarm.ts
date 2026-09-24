"use client";

/**
 * Kitchen alarm: a loud, repeating two-tone beep made with WebAudio (no audio
 * files to load). Browsers only allow sound after a user gesture, which is why
 * the dashboard has a "Start shift" button.
 */
let ctx: AudioContext | null = null;
let loop: number | null = null;

export async function unlockAudio(): Promise<boolean> {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new AC();
    if (ctx.state === "suspended") await ctx.resume();
    // A silent blip keeps iOS happy.
    beep(1, 0.001, 0.01);
    return ctx.state === "running";
  } catch {
    return false;
  }
}

export function audioReady() {
  return !!ctx && ctx.state === "running";
}

function beep(freq: number, gain = 0.35, dur = 0.16, at = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function ring() {
  [0, 0.2, 0.4, 0.8, 1.0, 1.2].forEach((at, i) => beep(i % 2 ? 660 : 988, 0.4, 0.16, at));
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400]);
  } catch {
    /* ignore */
  }
}

/** Start/stop the repeating alarm (idempotent). */
export function setAlarm(on: boolean) {
  if (on && loop === null) {
    ring();
    loop = window.setInterval(ring, 2600);
  } else if (!on && loop !== null) {
    window.clearInterval(loop);
    loop = null;
  }
}

/** A short friendly chime (order picked up etc.). */
export function chime() {
  beep(1175, 0.2, 0.12);
  beep(1568, 0.2, 0.18, 0.12);
}

type WakeLockSentinelLike = { release: () => Promise<void>; released?: boolean };
let lock: WakeLockSentinelLike | null = null;

/** Keep the screen on (re-acquired when the tab becomes visible again). */
export async function keepAwake(on: boolean) {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } };
    if (on && nav.wakeLock && (!lock || lock.released)) lock = await nav.wakeLock.request("screen");
    if (!on && lock) {
      await lock.release();
      lock = null;
    }
    return !!lock;
  } catch {
    return false;
  }
}
