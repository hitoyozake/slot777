// 各リールのシンボルリスト（重み付き、BLANKなし）
// 通常: BAR×8, WATER×6, CHERRY×3, BELL×2, 7×1 = 20
const REEL_STRIP = [
  'BAR','WATER','BAR','WATER','BAR','CHERRY','BAR','WATER',
  'BAR','CHERRY','WATER','BAR','WATER','BELL','BAR','CHERRY',
  'WATER','BAR','BELL','7',
];

// フィーバー: 7×2, BELL×5, CHERRY×5, WATER×4, BAR×4 = 20
const FEVER_REEL_STRIP = [
  '7','BELL','WATER','CHERRY','BAR','CHERRY','BELL','BAR',
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
