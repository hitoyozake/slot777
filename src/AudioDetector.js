// くるくるチャイムのベル音（金属質・1kHz〜4kHz帯）を検出する
const DETECT_FREQ_LOW  = 1000;  // Hz
const DETECT_FREQ_HIGH = 4000;  // Hz
const AMPLITUDE_THRESHOLD = 80; // AnalyserNode の 0〜255 スケール
const COOLDOWN_MS = 500;        // 検出後の再検知抑制期間

export class AudioDetector {
  constructor() {
    this._handlers = [];
    this._context = null;
    this._analyser = null;
    this._source = null;
    this._rafId = null;
    this._lastDetectedAt = 0;
    this.active = false;
  }

  on(event, handler) {
    if (event === 'bell') this._handlers.push(handler);
  }

  async start() {
    // iOS Safari: AudioContext はユーザー操作後でないと生成できない
    this._context = new (window.AudioContext || window.webkitAudioContext)();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this._source = this._context.createMediaStreamSource(stream);
    this._stream = stream;

    this._analyser = this._context.createAnalyser();
    this._analyser.fftSize = 2048;
    this._source.connect(this._analyser);

    this.active = true;
    this._loop();
  }

  stop() {
    this.active = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._stream?.getTracks().forEach(t => t.stop());
    this._context?.close();
    this._context = null;
  }

  _loop() {
    if (!this.active) return;
    this._rafId = requestAnimationFrame(() => this._loop());

    const bufferLength = this._analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    this._analyser.getByteFrequencyData(data);

    const sampleRate = this._context.sampleRate;
    const binHz = sampleRate / this._analyser.fftSize;
    const lowBin  = Math.floor(DETECT_FREQ_LOW  / binHz);
    const highBin = Math.ceil(DETECT_FREQ_HIGH / binHz);

    // 対象帯域の最大振幅を取得
    let peak = 0;
    for (let i = lowBin; i <= highBin && i < bufferLength; i++) {
      if (data[i] > peak) peak = data[i];
    }

    const now = performance.now();
    if (peak >= AMPLITUDE_THRESHOLD && now - this._lastDetectedAt > COOLDOWN_MS) {
      this._lastDetectedAt = now;
      this._handlers.forEach(fn => fn());
    }
  }
}
