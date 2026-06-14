// 各リールのシンボルリスト（重み付き）
const REEL_STRIP = [
  'BLANK','BAR','BLANK','WATER','BLANK','CHERRY','BLANK','BAR',
  'BLANK','WATER','BLANK','CHERRY','BLANK','BELL','BLANK','BAR',
  'BLANK','WATER','BLANK','7',
];

const FEVER_REEL_STRIP = [
  'BLANK','BAR','WATER','CHERRY','BAR','CHERRY','BELL','BAR',
  'WATER','CHERRY','BELL','CHERRY','BAR','BELL','WATER','BAR',
  'CHERRY','WATER','BELL','7',
];

function pickIndex(strip) {
  return Math.floor(Math.random() * strip.length);
}

export class ReelEngine {
  constructor() {
    this._feverMode = false;
    // 各リールの停止インデックス（3行分表示するため、上段・中段・下段）
    this._positions = [0, 0, 0];
  }

  setFeverMode(enabled) {
    this._feverMode = enabled;
  }

  spin() {
    // スピン開始時にランダムな停止位置を決定
    const strip = this._feverMode ? FEVER_REEL_STRIP : REEL_STRIP;
    this._positions = [
      pickIndex(strip),
      pickIndex(strip),
      pickIndex(strip),
    ];
  }

  // 3×3グリッドを返す: grid[row][col]
  getGrid() {
    const strip = this._feverMode ? FEVER_REEL_STRIP : REEL_STRIP;
    const len = strip.length;
    return [0, 1, 2].map(row =>
      this._positions.map(pos => strip[(pos + row) % len])
    );
  }

  getStrip() {
    return this._feverMode ? FEVER_REEL_STRIP : REEL_STRIP;
  }

  getPositions() {
    return [...this._positions];
  }
}
