const BELL_BOOST = 20;
const DECAY_PER_SEC = 5;
const TICK_MS = 100;

export class FeverGauge {
  constructor() {
    this.value = 0;
    this.isFever = false;
    this._handlers = { change: [], fever_start: [], fever_end: [] };
    this._timer = null;
    this._start();
  }

  onBell() {
    if (this.isFever) return;
    this.value = Math.min(100, this.value + BELL_BOOST);
    this._emit('change');
    if (this.value >= 100) this._startFever();
  }

  on(event, handler) {
    this._handlers[event]?.push(handler);
  }

  endFever() {
    if (!this.isFever) return;
    this.isFever = false;
    this.value = 0;
    this._emit('fever_end');
    this._emit('change');
  }

  _startFever() {
    this.isFever = true;
    this._emit('fever_start');
  }

  _start() {
    this._timer = setInterval(() => {
      if (this.isFever || this.value <= 0) return;
      this.value = Math.max(0, this.value - DECAY_PER_SEC * (TICK_MS / 1000));
      this._emit('change');
    }, TICK_MS);
  }

  destroy() {
    clearInterval(this._timer);
  }

  _emit(event) {
    this._handlers[event]?.forEach(fn => fn(this));
  }
}
