window.onload = function() {
    const startButton = document.getElementById('start');
    const pitchDisplay = document.getElementById('pitch');
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let isTuning = false;
  
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
            dataArray = new Uint8Array(analyser.frequencyBinCount);
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
  
    function updatePitch() {
      if (!isTuning) return;
      requestAnimationFrame(updatePitch);
      analyser.getByteFrequencyData(dataArray);
      const pitch = detectPitch(dataArray);
      pitchDisplay.textContent = `Pitch: ${pitch.toFixed(2)} Hz`;
      adjustDisplay(pitch);
    }
  
    function detectPitch(data) {
      let maxVal = -1;
      let index = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > maxVal) {
          maxVal = data[i];
          index = i;
        }
      }
      return index * audioContext.sampleRate / analyser.fftSize;
    }
  
    function adjustDisplay(pitch) {
      const standardPitches = [82.41, 110, 146.83, 196, 246.94, 329.63]; // E2, A2, D3, G3, B3, E4
      let closest = standardPitches.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a);
      pitchDisplay.style.color = Math.abs(closest - pitch) < 1 ? 'green' : 'red';
    }
  };
  