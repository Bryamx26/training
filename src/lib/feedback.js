// Signaux sonores et vibrations du lecteur de séance.

let audioContext = null;

// Le contexte audio doit être créé après un geste de l'utilisateur (règle des
// navigateurs) : appeler unlockAudio() au clic sur « Lancer » / « Suivant ».
export function unlockAudio() {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch {
    audioContext = null;
  }
}

// Bip court ; `long` pour la fin d'une phase.
export function beep({ long = false } = {}) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.frequency.value = long ? 660 : 880;
  const duration = long ? 0.45 : 0.12;
  gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

export function vibrate(pattern) {
  navigator.vibrate?.(pattern);
}
