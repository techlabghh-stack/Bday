// --- DYNAMIC SCATTERED FLOATING EMOJIS BACKGROUND ---
const canvas = document.getElementById('emoji-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const emojiList = ['🎉', '🎂', '🎈', '🎁', '✨', '🥳', '💖', '🎵', '🍰', '⭐'];
const numEmojis = 25;
const emojis = [];

class FloatingEmoji {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 20 + 20; // Size between 20px and 40px
    this.emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vRot;

    // Bounce off edges
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = `${this.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

for (let i = 0; i < numEmojis; i++) {
  emojis.push(new FloatingEmoji());
}

function animateEmojis() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  emojis.forEach(e => {
    e.update();
    e.draw();
  });
  requestAnimationFrame(animateEmojis);
}
animateEmojis();

// --- STATE MANAGEMENT & DOM ELEMENTS ---
const stepCountdown = document.getElementById('step-countdown');
const stepCake = document.getElementById('step-cake');
const stepEnvelope = document.getElementById('step-envelope');
const stepFeedback = document.getElementById('step-feedback');
const stepReactionYes = document.getElementById('step-reaction-yes');
const stepReactionNo = document.getElementById('step-reaction-no');

const countdownNumber = document.getElementById('countdown-number');
const blowBtn = document.getElementById('blow-btn');
const cakeInstruction = document.getElementById('cake-instruction');
const micStatus = document.getElementById('mic-status');

const envelope = document.getElementById('envelope');
const toggleEnvelopeBtn = document.getElementById('toggle-envelope-btn');

const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const btnRestart = document.getElementById('btn-restart');

let blowCount = 0;
let audioContext = null;
let micStream = null;

// --- STEP 1: COUNTDOWN LOGIC ---
let count = 5;
const countdownInterval = setInterval(() => {
  count--;
  if (count > 0) {
    countdownNumber.textContent = count;
  } else {
    clearInterval(countdownInterval);
    // Transition to Step 2 (Cake)
    stepCountdown.classList.add('hidden');
    stepCake.classList.remove('hidden');
    stepCake.classList.add('flex');
    initMicrophone();
  }
}, 1000);

// --- STEP 2: CANDLE BLOWING LOGIC ---
function performBlow() {
  blowCount++;
  const flames = document.querySelectorAll('.flame');

  if (blowCount === 1) {
    // First Blow: Flames weaken and flicker
    flames.forEach(f => f.classList.add('weak'));
    cakeInstruction.textContent = 'Almost there! Blow again! 💨';
  } else if (blowCount >= 2) {
    // Second Blow: Candles extinguished completely
    flames.forEach(f => {
      f.classList.remove('weak');
      f.classList.add('extinguished');
    });

    // Trigger Smoke
    document.querySelectorAll('.smoke').forEach(s => s.classList.add('active'));

    // Trigger Confetti Pop
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    cakeInstruction.textContent = 'Make a Wish! ✨';
    blowBtn.classList.add('hidden');
    micStatus.textContent = 'Candles blown out!';

    // Cleanup Mic Stream
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
    }

    // Transition to Envelope after short delay
    setTimeout(() => {
      stepCake.classList.add('hidden');
      stepCake.classList.remove('flex');
      stepEnvelope.classList.remove('hidden');
      stepEnvelope.classList.add('flex');
    }, 1800);
  }
}

blowBtn.addEventListener('click', performBlow);

// Real-Time Audio Blow Detection
async function initMicrophone() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(micStream);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    let lastBlowTime = 0;

    javascriptNode.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      let values = 0;
      for (let i = 0; i < array.length; i++) {
        values += array[i];
      }
      const average = values / array.length;

      // Threshold for blow detection
      if (average > 45 && Date.now() - lastBlowTime > 1200) {
        lastBlowTime = Date.now();
        performBlow();
      }
    };
    micStatus.textContent = '🎤 Mic detected! Blow into your microphone!';
  } catch (err) {
    micStatus.textContent = '(Mic access unavailable — tap the button to blow!)';
  }
}

// --- STEP 3: ENVELOPE TOGGLE LOGIC ---
let isEnvelopeOpen = false;

toggleEnvelopeBtn.addEventListener('click', () => {
  if (!isEnvelopeOpen) {
    // Open Envelope & Reveal Letter
    envelope.classList.add('open');
    toggleEnvelopeBtn.textContent = '🔒 Close Message';
    isEnvelopeOpen = true;

    // Confetti burst on opening
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 }
      });
    }
  } else {
    // Close Envelope and move to Feedback question
    envelope.classList.remove('open');
    
    setTimeout(() => {
      stepEnvelope.classList.add('hidden');
      stepEnvelope.classList.remove('flex');
      stepFeedback.classList.remove('hidden');
      stepFeedback.classList.add('flex');
    }, 500);
  }
});

// --- STEP 4 & 5: FEEDBACK LOGIC ---
btnYes.addEventListener('click', () => {
  stepFeedback.classList.add('hidden');
  stepFeedback.classList.remove('flex');
  stepReactionYes.classList.remove('hidden');
  stepReactionYes.classList.add('flex');

  // Big Confetti Celebration
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.4 }
    });
  }
});

btnNo.addEventListener('click', () => {
  stepFeedback.classList.add('hidden');
  stepFeedback.classList.remove('flex');
  stepReactionNo.classList.remove('hidden');
  stepReactionNo.classList.add('flex');
});

btnRestart.addEventListener('click', () => {
  window.location.reload();
});
