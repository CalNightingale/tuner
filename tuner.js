import { detectYIN } from './pitchAlgs.js';

window.onload = function() {
  const startButton = document.getElementById('start');
  const pitchDisplay = document.getElementById('pitch');
  const needleSVG = document.getElementById('needleSVG');
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let isTuning = false;
  const pitchThreshold = 20; // The threshold in Hz

  startButton.onclick = async function() {
    if (!isTuning) {
      isTuning = true;
      startButton.textContent = 'Stop Tuner';
      if (!audioContext) {
        try {
          audioContext = new AudioContext();
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = audioContext.createMediaStreamSource(stream);
          analyser = audioContext.createAnalyser();
          source.connect(analyser);
          analyser.fftSize = 2048;
          dataArray = new Float32Array(analyser.fftSize); // Use Float32Array for better precision with YIN
        } catch (error) {
          pitchDisplay.textContent = 'Error accessing microphone';
          console.error('Microphone access error:', error);
          return;
        }
      }
      updatePitch();
    } else {
      isTuning = false;
      startButton.textContent = 'Start Tuner';
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
    }
  };

  const degToRad = deg => (deg * Math.PI) / 180.0; // Convert degrees to radians using the formula: radians = (degrees * Math.PI) / 180

  function updatePitch() {
    if (!isTuning) return;
    requestAnimationFrame(updatePitch);
    analyser.getFloatTimeDomainData(dataArray); // Changed to getFloatTimeDomainData for YIN
    const pitch = detectYIN(dataArray);
    if (pitch !== -1) {
      const note = getNote(pitch);
      if (note == -1) {
        return;
      }
      updateTunerDisplay(note.note, note.offBy);
    } else {
      updateTunerDisplay('--', 0);
    }
  }

  function getNote(pitch) {
    const standardNotes = [
      {note: 'E2', frequency: 82.41},
      {note: 'A2', frequency: 110},
      {note: 'D3', frequency: 146.83},
      {note: 'G3', frequency: 196},
      {note: 'B3', frequency: 246.94},
      {note: 'E4', frequency: 329.63}
    ];
    
    // This will hold the closest note found, if any, and the difference in Hz
    let closest = {note: '', difference: Infinity};
  
    // Find the closest standard note to the detected pitch
    standardNotes.forEach(standardNote => {
      const difference = standardNote.frequency - pitch;
      if (Math.abs(difference) < closest.difference) {
        closest = {
          note: standardNote.note,
          difference: difference
        };
      }
    });
  
    // Check if the closest note is within the pitch threshold
    if (closest.difference <= pitchThreshold) {
      return { note: closest.note, offBy: closest.difference };
    } else {
      return -1;
    }
  }

  function updateTunerDisplay(note, hertzOff) {
    // Update the note display
    noteDisplay.textContent = note;
    console.log(hertzOff);
    // Convert cents off to needle rotation (-50 to +50 range for -50 cents to +50 cents)
    const rotationBound = 30; // degrees
    const conversionFactor = rotationBound / pitchThreshold;
    let rotation = hertzOff * conversionFactor;
    // Apply rotation to the needle element
    needleSVG.style.transform = `rotate(${rotation}deg)`;
  }
};
