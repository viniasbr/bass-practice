// 1. Chord definitions (intervals in semitones, root excluded as it's played only in bass)
const CHORDS = {
  // Triads
  maj: [4, 7],
  min: [3, 7],
  dim: [3, 6],
  aug: [4, 8],
  
  // Seventh chords (Tetrads)
  maj7: [4, 7, 11],
  '7': [4, 7, 10],
  min7: [3, 7, 10],
  m7b5: [3, 6, 10],
  dim7: [3, 6, 9],
  mMaj7: [3, 7, 11],
  aug7: [4, 8, 11],
  '7b5': [4, 6, 10],
  '7#5': [4, 8, 10],
  
  // Sixth chords
  '6': [4, 7, 9],
  min6: [3, 7, 9],
  
  // Add chords
  add9: [4, 7, 14],
  add11: [4, 7, 17],
  add2: [2, 4, 7],
  
  // Suspended seventh chords
  '7sus4': [5, 7, 10],
  '7sus2': [2, 7, 10],
  
  // Ninth chords (Pentads)
  '9': [4, 7, 10, 14],
  maj9: [4, 7, 11, 14],
  min9: [3, 7, 10, 14],
  mMaj9: [3, 7, 11, 14],
  '7b9': [4, 7, 10, 13],
  '7#9': [4, 7, 10, 15],
  
  // Sixth-ninth chord
  '6/9': [4, 7, 9, 14],
  
  // Extended add chords
  'add9-11': [4, 7, 14, 17],
  'add9-13': [4, 7, 14, 21],
  
  // Suspended ninth chords
  '9sus4': [5, 7, 10, 14],
  '9sus2': [2, 7, 10, 14],
  
  // Altered-9th pentads
  '7b5b9': [4, 6, 10, 13],
  '7#5#9': [4, 8, 10, 15]
};

// 2. Load piano instrument
let piano;

async function initAudio() {
  // Create a piano synth instead of loading samples
  piano = new Tone.Sampler({
    urls: {
      "A0": "A0.mp3",
      "C1": "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      "A1": "A1.mp3",
      "C2": "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      "A2": "A2.mp3",
      "C3": "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      "A3": "A3.mp3",
      "C4": "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      "A4": "A4.mp3",
      "C5": "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      "A5": "A5.mp3",
      "C6": "C6.mp3",
      "D#6": "Ds6.mp3",
      "F#6": "Fs6.mp3",
      "A6": "A6.mp3",
      "C7": "C7.mp3",
      "D#7": "Ds7.mp3",
      "F#7": "Fs7.mp3",
      "A7": "A7.mp3",
      "C8": "C8.mp3"
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    onload: () => {
      console.log("Piano samples loaded");
    },
    attack: 0.1,
    release: 1.5,  // Added longer release time for smoother fade out
    volume: -6     // Slightly reduce volume to prevent clipping
  }).toDestination();
}

// 3. State State
let currentRootMidi = null;   // MIDI number for bass root
let currentIntervals = null;  // selected chord intervals
let chordRevealed = false;

// 4. Utility: pick random MIDI 36 (C2)–47 (B2)
function randomBassMidi() {
  return 36 + Math.floor(Math.random() * 12);
}

// 5a. Play full chord (bass + voicing)
async function playFull() {
  if (!piano || !currentIntervals) return;
  await Tone.start();
  const t = Tone.now();
  const rootNote = Tone.Frequency(currentRootMidi, 'midi').toNote();
  piano.triggerAttackRelease(rootNote, '1n', t);
  currentIntervals.forEach(i => {
    const note = Tone.Frequency(currentRootMidi + i + 12, 'midi').toNote();
    piano.triggerAttackRelease(note, '1n', t);
  });
}

// 5b. Play chord voicing only
function playWithoutBass() {
  if (!piano || !currentIntervals) return;
  const t = Tone.now();
  currentIntervals.forEach(i => {
    const note = Tone.Frequency(currentRootMidi + i + 12, 'midi').toNote();
    piano.triggerAttackRelease(note, '1n', t);
  });
}

// 5c. Reveal bass only
function playReveal() {
  if (!piano || currentRootMidi === null) return;
  const t = Tone.now();
  const note = Tone.Frequency(currentRootMidi, 'midi').toNote();
  piano.triggerAttackRelease(note, '1n', t);
  const chordName = getChordName(currentIntervals);
  document.getElementById('result').textContent = `Nota do baixo: ${note} — Estrutura: ${chordName}`;
  chordRevealed = true;
}

function getChordName(intervals) {
  const mapping = {
    // Triads
    maj: '1-3-5',
    min: '1-♭3-5',
    dim: '1-♭3-♭5',
    aug: '1-3-♯5',
    
    // Seventh chords
    maj7: '1-3-5-7',
    '7': '1-3-5-♭7',
    min7: '1-♭3-5-♭7',
    m7b5: '1-♭3-♭5-♭7',
    dim7: '1-♭3-♭5-𝄫7',
    mMaj7: '1-♭3-5-7',
    aug7: '1-3-♯5-7',
    '7b5': '1-3-♭5-♭7',
    '7#5': '1-3-♯5-♭7',
    
    // Sixth chords
    '6': '1-3-5-6',
    min6: '1-♭3-5-6',
    
    // Add chords
    add9: '1-3-5-9',
    add11: '1-3-5-11',
    add2: '1-2-3-5',
    
    // Suspended seventh chords
    '7sus4': '1-4-5-♭7',
    '7sus2': '1-2-5-♭7',
    
    // Ninth chords
    '9': '1-3-5-♭7-9',
    maj9: '1-3-5-7-9',
    min9: '1-♭3-5-♭7-9',
    mMaj9: '1-♭3-5-7-9',
    '7b9': '1-3-5-♭7-♭9',
    '7#9': '1-3-5-♭7-♯9',
    
    // Sixth-ninth chord
    '6/9': '1-3-5-6-9',
    
    // Extended add chords
    'add9-11': '1-3-5-9-11',
    'add9-13': '1-3-5-9-13',
    
    // Suspended ninth chords
    '9sus4': '1-4-5-♭7-9',
    '9sus2': '1-2-5-♭7-9',
    
    // Altered-9th pentads
    '7b5b9': '1-3-♭5-♭7-♭9',
    '7#5#9': '1-3-♯5-♭7-♯9'
  };
  
  for (const key in CHORDS) {
    if (CHORDS[key].length === intervals.length &&
        CHORDS[key].every((v,i) => v === intervals[i])) {
      return mapping[key];
    }
  }
  return '';
}

// 6. UI wiring
window.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.getElementById('play-new');
  const hintBtn = document.getElementById('hint');
  const revealBtn = document.getElementById('reveal');
  const boxes = document.querySelectorAll('#chord-options input[type=checkbox]');

  // Initialize Audio Context only on first user interaction
  let audioInitialized = false;

  async function ensureAudioInitialized() {
    if (!audioInitialized) {
      await Tone.start();
      await initAudio();
      audioInitialized = true;
    }
  }

  playBtn.addEventListener('click', async () => {
    await ensureAudioInitialized();
    
    if (!chordRevealed && currentRootMidi !== null) {
      playFull();
    } else {
      const pool = Array.from(boxes).filter(b => b.checked).map(b => b.value);
      if (!pool.length) { alert('Selecione pelo menos um tipo de acorde!'); return; }
      currentIntervals = CHORDS[pool[Math.floor(Math.random() * pool.length)]];
      currentRootMidi = randomBassMidi();
      chordRevealed = false;
      document.getElementById('result').textContent = '';
      hintBtn.disabled = false;
      revealBtn.disabled = false;
      playFull();
    }
  });

  hintBtn.addEventListener('click', async () => {
    await ensureAudioInitialized();
    playWithoutBass();
  });

  revealBtn.addEventListener('click', async () => {
    await ensureAudioInitialized();
    playReveal();
  });
});
