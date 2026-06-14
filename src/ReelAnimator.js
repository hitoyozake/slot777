const CELL_H         = 72;   // CSSの.reel-symbolの高さと一致させる
const SPIN_SPEED     = 2800; // px/sec: 高速回転時の速度
const ACCEL_DURATION = 200;  // ms: 加速フェーズ
const DECEL_DURATION = 500;  // ms: 減速フェーズ
const BOUNCE_OVER    = 18;   // px: バウンス時の行き過ぎ量
const BOUNCE_BACK    = 80;   // ms: バウンスの戻り時間
const COPIES         = 8;    // ストリップのコピー数（ループ用）

// イージング関数
const easeInQuad  = t => t * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export class ReelAnimator {
  /**
   * @param {HTMLElement} windowEl - overflow:hidden のコンテナ
   * @param {Object} symbolMap    - { 'BELL': '🔔', ... }
   * @param {string[]} strip      - リールストリップ（20要素）
   */
  constructor(windowEl, symbolMap, strip) {
    this._window    = windowEl;
    this._symbolMap = symbolMap;
    this._strip     = [...strip];
    this._stripEl   = document.createElement('div');
    this._stripEl.className = 'reel-strip';
    windowEl.appendChild(this._stripEl);

    this._y       = 0;
    this._rafId   = null;
    this._lastTs  = null;
    this._phase   = 'idle'; // 'idle' | 'accel' | 'spin' | 'decel' | 'bounce'

    this._build();
    this._showPos(0);
  }

  // ── ストリップ構築 ──────────────────────────────────────────
  _build() {
    this._stripEl.innerHTML = '';
    for (let c = 0; c < COPIES; c++) {
      for (const sym of this._strip) {
        const el = document.createElement('div');
        el.className = 'reel-symbol';
        el.textContent = this._symbolMap[sym] ?? '?';
        this._stripEl.appendChild(el);
      }
    }
  }

  _setY(y) {
    this._y = y;
    this._stripEl.style.transform = `translateY(${y}px)`;
  }

  // 指定シンボルを上段に表示（アイドル時用）
  _showPos(pos) {
    const singleH = this._strip.length * CELL_H;
    this._setY(-(singleH + pos * CELL_H));
  }

  // ── 公開API ────────────────────────────────────────────────

  updateStrip(newStrip) {
    this._strip = [...newStrip];
    this._build();
    this._showPos(0);
  }

  /** 全リールを同時に回転開始 */
  startSpin() {
    this._phase  = 'accel';
    this._lastTs = null;
    this._accelStart = null;
    this._currentSpeed = 0;
    cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(ts => this._spinLoop(ts));
  }

  /**
   * 指定位置でリールを停止（バウンス付き）
   * @param {number} pos   - ストリップ上の停止位置（上段に表示されるシンボルのindex）
   * @param {number} delay - 停止開始までの遅延ms
   * @returns {Promise<void>}
   */
  stopAt(pos, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        this._phase = 'decel';
        cancelAnimationFrame(this._rafId);

        const singleH  = this._strip.length * CELL_H;
        const minDist  = singleH * 0.5;  // 最低でも半ストリップ分進んで停止
        const safeBound = -((COPIES - 1) * singleH); // 末端1コピーは余白として確保

        // copy0のposを基点に、現在地より minDist 以上先を探す
        let targetY = -(pos * CELL_H);
        while (targetY > this._y - minDist) targetY -= singleH;
        // 安全圏を超えた場合は1コピー戻す
        while (targetY < safeBound) targetY += singleH;

        const startY = this._y;
        const dist   = targetY - startY;
        let t0 = null;

        // フェーズ1: 減速（ease-out cubic）
        const decelStep = ts => {
          if (t0 === null) t0 = ts;
          const t = Math.min((ts - t0) / DECEL_DURATION, 1);
          this._setY(startY + dist * easeOutCubic(t));

          if (t < 1) {
            this._rafId = requestAnimationFrame(decelStep);
          } else {
            this._setY(targetY);
            // フェーズ2: バウンス（わずかに行き過ぎて戻る）
            this._doBounce(targetY, resolve);
          }
        };
        this._rafId = requestAnimationFrame(decelStep);
      }, delay);
    });
  }

  _doBounce(targetY, resolve) {
    this._phase = 'bounce';
    // 行き過ぎ → 戻る の2段階トゥイーン
    const overY = targetY - BOUNCE_OVER; // 少し行き過ぎ（上方向）
    let t0 = null;

    const overStep = ts => {
      if (t0 === null) t0 = ts;
      const halfDur = BOUNCE_BACK * 0.45;
      const t = Math.min((ts - t0) / halfDur, 1);
      this._setY(targetY + (overY - targetY) * easeOutCubic(t));
      if (t < 1) {
        this._rafId = requestAnimationFrame(overStep);
      } else {
        this._setY(overY);
        // 戻り
        let t1 = null;
        const backStep = ts => {
          if (t1 === null) t1 = ts;
          const t = Math.min((ts - t1) / (BOUNCE_BACK * 0.55), 1);
          this._setY(overY + (targetY - overY) * easeOutCubic(t));
          if (t < 1) {
            this._rafId = requestAnimationFrame(backStep);
          } else {
            this._setY(targetY);
            this._phase = 'idle';
            resolve();
          }
        };
        this._rafId = requestAnimationFrame(backStep);
      }
    };
    this._rafId = requestAnimationFrame(overStep);
  }

  // ── 内部アニメーションループ ───────────────────────────────
  _spinLoop(ts) {
    if (this._phase !== 'accel' && this._phase !== 'spin') return;
    if (this._lastTs === null) this._lastTs = ts;
    const dt = Math.min((ts - this._lastTs) / 1000, 0.05);
    this._lastTs = ts;

    if (this._phase === 'accel') {
      if (this._accelStart === null) this._accelStart = ts;
      const at = Math.min((ts - this._accelStart) / ACCEL_DURATION, 1);
      this._currentSpeed = SPIN_SPEED * easeInQuad(at);
      if (at >= 1) this._phase = 'spin';
    } else {
      this._currentSpeed = SPIN_SPEED;
    }

    const singleH = this._strip.length * CELL_H;
    let newY = this._y - this._currentSpeed * dt;
    // 末端から3コピー手前でジャンプ（this._y が安全圏を超えないようにする）
    if (newY < -(COPIES - 3) * singleH) newY += singleH;
    this._setY(newY);

    this._rafId = requestAnimationFrame(ts => this._spinLoop(ts));
  }

  // ── ハイライト ─────────────────────────────────────────────
  highlightRow(row) {
    this._getVisibleEls()[row]?.classList.add('hit');
  }

  clearHighlights() {
    this._stripEl.querySelectorAll('.reel-symbol.hit')
      .forEach(el => el.classList.remove('hit'));
  }

  _getVisibleEls() {
    const topIdx = Math.round(-this._y / CELL_H);
    const all = this._stripEl.querySelectorAll('.reel-symbol');
    return [all[topIdx], all[topIdx + 1], all[topIdx + 2]];
  }
}
