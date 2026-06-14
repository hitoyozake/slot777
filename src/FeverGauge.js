const BELL_BOOST      = 20;
const DECAY_PER_SEC   = 5;
const TICK_MS         = 100;
const MAX_DURATION_MS = 10000;
const WIN_BOOST_MS    = 3000;
const WIN_PAUSE_MS    = 3000;

export class FeverGauge {
  constructor() {
    this.value          = 0;
    this.isFever        = false;
    this._feverTimer    = 0; // MAX中の残り時間(ms)
    this._winPauseTimer = 0; // 絵柄一致後の減衰ストップ残り時間(ms)
    this._handlers      = { change: [], fever_start: [], fever_end: [] };
    this._timer         = null;
    this._start();
  }

  // ベル検出時
  onBell() {
    if (this.isFever) {
      // MAX中はタイマーを10秒にリセット
      this._feverTimer = MAX_DURATION_MS;
      this._emit('change');
      return;
    }
    this.value = Math.min(100, this.value + BELL_BOOST);
    this._emit('change');
    if (this.value >= 100) this._startFever();
  }

  // スロット当選時
  onWin() {
    if (this.isFever) {
      // MAX中は残り時間を+3秒（10秒上限）
      this._feverTimer = Math.min(MAX_DURATION_MS, this._feverTimer + WIN_BOOST_MS);
      this._emit('change');
    } else {
      // 通常減衰中は3秒間減衰ストップ
      this._winPauseTimer = WIN_PAUSE_MS;
    }
  }

  get feverTimeRemaining() {
    return this._feverTimer;
  }

  on(event, handler) {
    this._handlers[event]?.push(handler);
  }

  destroy() {
    clearInterval(this._timer);
  }

  _startFever() {
    this.isFever     = true;
    this.value       = 100;
    this._feverTimer = MAX_DURATION_MS;
    this._winPauseTimer = 0;
    this._emit('fever_start');
    this._emit('change');
  }

  _endFever() {
    this.isFever     = false;
    this._feverTimer = 0;
    this.value       = 99; // MAXから99%へ即座に落とし、通常減衰開始
    this._emit('fever_end');
    this._emit('change');
  }

  _start() {
    this._timer = setInterval(() => {
      if (this.isFever) {
        this._feverTimer -= TICK_MS;
        if (this._feverTimer <= 0) {
          this._endFever();
        } else {
          this._emit('change'); // タイマー表示更新
        }
        return;
      }

      if (this.value <= 0) return;

      if (this._winPauseTimer > 0) {
        this._winPauseTimer -= TICK_MS;
        return; // 減衰ストップ中
      }

      this.value = Math.max(0, this.value - DECAY_PER_SEC * (TICK_MS / 1000));
      this._emit('change');
    }, TICK_MS);
  }

  _emit(event) {
    this._handlers[event]?.forEach(fn => fn(this));
  }
}
