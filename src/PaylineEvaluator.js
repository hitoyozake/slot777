const PAYOUTS = {
  '7':      100,
  'BELL':   30,
  'CHERRY': 10,
  'WATER':  5,
  'BAR':    3,
};

// 5ライン定義: [row, col] の3マス
const LINES = [
  [[0,0],[0,1],[0,2]], // 上段横
  [[1,0],[1,1],[1,2]], // 中段横
  [[2,0],[2,1],[2,2]], // 下段横
  [[0,0],[1,1],[2,2]], // 左上→右下斜め
  [[2,0],[1,1],[0,2]], // 左下→右上斜め
];

export class PaylineEvaluator {
  // grid: 3×3の二次元配列（シンボル文字列）
  evaluate(grid) {
    const hits = [];
    for (let i = 0; i < LINES.length; i++) {
      const line = LINES[i];
      const symbols = line.map(([r, c]) => grid[r][c]);
      if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        const payout = (PAYOUTS[symbols[0]] ?? 0) * 1;
        if (payout > 0) hits.push({ lineIndex: i, symbol: symbols[0], payout });
      }
    }
    return hits;
  }

  totalPayout(hits) {
    return hits.reduce((sum, h) => sum + h.payout, 0);
  }

  getLines() {
    return LINES;
  }
}
