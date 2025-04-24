// 1. Chord definitions (intervals in semitones from root, voicings optimized)
const CHORDS = {
  // Dyads
  maj3: [4],
  min3: [3],
  fifth: [7],
  
  // Triads - root position works well
  maj: [4, 7],
  min: [3, 7],
  dim: [3, 6],
  aug: [4, 8],
  
  // Seventh chords - close position voicings
  maj7: [4, 7, 11],
  '7': [4, 7, 10],
  min7: [3, 7, 10],
  m7b5: [3, 6, 10],
  dim7: [3, 6, 9],
  mMaj7: [3, 7, 11],
  aug7: [4, 8, 11],
  '7b5': [4, 6, 10],
  '7#5': [4, 8, 10],
  
  // Sixth chords - close position
  '6': [4, 7, 9],
  min6: [3, 7, 9],
  
  // Add chords - more compact voicings
  add9: [4, 7, 2],  // 1-3-5-9 but 9 brought down an octave
  add11: [4, 7, 5], // 1-3-5-11 but 11 brought down an octave
  add2: [2, 4, 7],  // already compact: 1-2-3-5
  
  // Suspended seventh chords
  '7sus4': [5, 7, 10],
  '7sus2': [2, 7, 10],
  
  // Ninth chords - more compact voicings
  '9': [4, 7, 10, 2],      // 9th brought down
  maj9: [4, 7, 11, 2],     // 9th brought down
  min9: [3, 7, 10, 2],     // 9th brought down
  mMaj9: [3, 7, 11, 2],    // 9th brought down
  '7b9': [4, 7, 10, 1],    // b9th brought down
  '7#9': [4, 7, 10, 3],    // #9th brought down
  
  // Sixth-ninth chord - compact voicing
  '6/9': [4, 7, 9, 2],     // 9th brought down
  
  // Extended add chords - more compact
  'add9-11': [4, 7, 2, 5], // 9 and 11 brought down
  'add9-13': [4, 7, 2, 9], // 9 and 13 brought down
  
  // Suspended ninth chords - compact
  '9sus4': [5, 7, 10, 2],  // 9th brought down
  '9sus2': [2, 7, 10, 2],  // 9th brought down
  
  // Altered-9th pentads - compact
  '7b5b9': [4, 6, 10, 1],  // b9th brought down
  '7#5#9': [4, 8, 10, 3]   // #9th brought down
};

// 2. Load piano instrument
let piano;
let pianoReady = false;

async function initAudio() {
  return new Promise((resolve, reject) => {
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
        pianoReady = true;
        resolve();
      },
      onerror: (error) => {
        console.error("Error loading piano samples:", error);
        reject(error);
      },
      attack: 0.1,
      release: 1.5,  // Added longer release time for smoother fade out
      volume: -6     // Slightly reduce volume to prevent clipping
    }).toDestination();
  });
}

// 3. State State
let currentRootMidi = null;   // MIDI number for bass root
let currentIntervals = null;  // selected chord intervals
let chordRevealed = false;

// 4. Utility: pick random MIDI 24 (C1)–47 (B2) for bass notes
function randomBassMidi() {
  return 24 + Math.floor(Math.random() * 24);
}

// New utility: ensure chord structure is in middle register and well-separated from bass
function adjustChordToMiddleRegister(referenceRoot, intervals, bassNote) {
  // Generate the actual MIDI notes for the chord
  let notes = intervals.map(i => referenceRoot + i);
  
  // Adjust individual notes that fall outside D3-G4 range (MIDI 50-67)
  notes = notes.map(note => {
    while (note > 67) { // Above G4
      note -= 12;
    }
    while (note < 50) { // Below D3
      note += 12;
    }
    return note;
  });
  
  // Check if ANY chord tone is too close to the bass note
  // If so, move the ENTIRE chord up an octave
  if (notes.some(note => note - bassNote < 12)) {
    notes = notes.map(note => note + 12);
  }
  
  return notes;
}

// 5a. Play full chord (bass + voicing)
async function playFull() {
  if (!piano || !currentIntervals || !pianoReady) return;
  await Tone.start();
  const t = Tone.now();
  
  // Play bass note
  const rootNote = Tone.Frequency(currentRootMidi, 'midi').toNote();
  piano.triggerAttackRelease(rootNote, '1n', t);
  
  // Calculate reference pitch for chord (C3 = 48)
  const referenceRoot = 48 + (currentRootMidi % 12);
  
  // Get adjusted chord notes, passing the bass note for spacing check
  const chordNotes = adjustChordToMiddleRegister(referenceRoot, currentIntervals, currentRootMidi);
  
  // Play chord structure in middle register
  chordNotes.forEach(midiNote => {
    const note = Tone.Frequency(midiNote, 'midi').toNote();
    piano.triggerAttackRelease(note, '1n', t);
  });
}

// 5b. Play chord voicing only (without bass)
async function playWithoutBass() {
  if (!piano || !currentIntervals || !pianoReady) return;
  const t = Tone.now();
  
  // Calculate reference pitch for chord (C3 = 48)
  const referenceRoot = 48 + (currentRootMidi % 12);
  
  // Get adjusted chord notes, passing the bass note for spacing check
  const chordNotes = adjustChordToMiddleRegister(referenceRoot, currentIntervals, currentRootMidi);
  
  // Play chord structure in middle register
  chordNotes.forEach(midiNote => {
    const note = Tone.Frequency(midiNote, 'midi').toNote();
    piano.triggerAttackRelease(note, '1n', t);
  });
}

// 5c. Reveal bass only
async function playReveal() {
  if (!piano || currentRootMidi === null || !pianoReady) return;
  const t = Tone.now();
  const note = Tone.Frequency(currentRootMidi, 'midi').toNote();
  piano.triggerAttackRelease(note, '1n', t);
  const chordName = getChordName(currentIntervals);
  document.getElementById('result').textContent = `Nota do baixo: ${note} — Estrutura: ${chordName}`;
  chordRevealed = true;
}

function getChordName(intervals) {
  const mapping = {
    // Dyads
    maj3: '1-3',
    min3: '1-♭3',
    fifth: '1-5',
    
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
  const selectAllBtn = document.getElementById('select-all');
  const boxes = document.querySelectorAll('#chord-options input[type=checkbox]');
  let allSelected = false;

  // Initialize Audio Context only on first user interaction
  let audioInitialized = false;

  // Select All functionality
  selectAllBtn.addEventListener('click', () => {
    allSelected = !allSelected;
    boxes.forEach(box => box.checked = allSelected);
    selectAllBtn.textContent = allSelected ? 'Desmarcar Todos' : 'Selecionar Todos';
  });

  async function ensureAudioInitialized() {
    if (!audioInitialized) {
      await Tone.start();
      try {
        await initAudio();
        audioInitialized = true;
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        alert("Erro ao carregar os sons. Por favor, recarregue a página.");
      }
    }
  }

  playBtn.addEventListener('click', async () => {
    try {
      await ensureAudioInitialized();
      
      if (!chordRevealed && currentRootMidi !== null) {
        await playFull();
      } else {
        const pool = Array.from(boxes).filter(b => b.checked).map(b => b.value);
        if (!pool.length) { alert('Selecione pelo menos um tipo de acorde!'); return; }
        currentIntervals = CHORDS[pool[Math.floor(Math.random() * pool.length)]];
        currentRootMidi = randomBassMidi();
        chordRevealed = false;
        document.getElementById('result').textContent = '';
        hintBtn.disabled = false;
        revealBtn.disabled = false;
        await playFull();
      }
    } catch (error) {
      console.error("Error playing chord:", error);
      alert("Erro ao tocar o acorde. Por favor, recarregue a página.");
    }
  });

  hintBtn.addEventListener('click', async () => {
    try {
      await ensureAudioInitialized();
      await playWithoutBass();
    } catch (error) {
      console.error("Error playing hint:", error);
      alert("Erro ao tocar o acorde. Por favor, recarregue a página.");
    }
  });

  revealBtn.addEventListener('click', async () => {
    try {
      await ensureAudioInitialized();
      await playReveal();
    } catch (error) {
      console.error("Error revealing chord:", error);
      alert("Erro ao revelar o acorde. Por favor, recarregue a página.");
    }
  });
});
