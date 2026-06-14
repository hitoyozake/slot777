# ユニット分解

## 概要図

```
┌─────────────────────────────────────────────┐
│                  UIRenderer                  │
│  (リール描画 / ゲージ表示 / 演出エフェクト)    │
└──────────────┬──────────────────────────────┘
               │ 状態を受け取り描画
┌──────────────▼──────────────────────────────┐
│              GameStateMachine                │
│         (IDLE / SPINNING / EVALUATING        │
│          / FEVER / RESULT)                   │
└───┬──────────┬──────────┬────────────────────┘
    │          │          │
    ▼          ▼          ▼
┌───────┐ ┌────────┐ ┌──────────┐
│ Reel  │ │Credit  │ │  Fever   │
│Engine │ │Manager │ │  Gauge   │
└───┬───┘ └────────┘ └────┬─────┘
    │                     │ イベント
    ▼                     ▼
┌────────────┐     ┌──────────────┐
│  Payline   │     │ AudioDetector│
│ Evaluator  │     │(BellSimulator│
└────────────┘     │ Phase1のみ)  │
                   └──────────────┘
```

---

## ユニット詳細

### 1. GameStateMachine
**責務:** ゲーム全体の状態遷移を管理する

**状態:**
```
IDLE → SPINNING → EVALUATING → RESULT → IDLE
                                  ↓
                               FEVER（ゲージ100%時）
```

| 状態 | 説明 | 許可操作 |
|------|------|----------|
| IDLE | 待機中 | SPIN, BET変更, ベル検出 |
| SPINNING | リール回転中 | なし（入力ロック） |
| EVALUATING | 当否判定中 | なし |
| RESULT | 結果表示中 | なし（自動遷移） |
| FEVER | フィーバー演出中 | SPIN |

**インターフェース:**
```js
stateMachine.transition(event)  // 'SPIN' | 'STOP' | 'BELL' | 'FEVER_START' | 'FEVER_END'
stateMachine.current            // 現在の状態
stateMachine.on(state, handler) // 状態変化のフック
```

---

### 2. ReelEngine
**責務:** 3つのリールの回転・停止・シンボル管理

**構成:**
- リール × 3（各リールは20シンボルのリスト）
- 停止位置は乱数で決定（確率テーブルに基づく重み付き抽選）

**インターフェース:**
```js
reelEngine.spin()                  // 全リール回転開始
reelEngine.stop(index)             // 指定リール停止（0=左, 1=中, 2=右）
reelEngine.getResult()             // 停止時の3×3シンボルグリッドを返す
reelEngine.setFeverMode(bool)      // フィーバー時に確率テーブルを切り替え
```

**シンボル種別（案）:**
| シンボル | 通常配当 | 出現重み |
|----------|----------|----------|
| 7 | 100 | 1 |
| ベル | 30 | 3 |
| チェリー | 10 | 8 |
| スイカ | 5 | 15 |
| BAR | 3 | 20 |
| ブランク | 0 | 53 |

---

### 3. PaylineEvaluator
**責務:** 3×3グリッドに対して5ラインの当否判定と配当計算

**判定ライン:**
```
ライン①: [0,0][0,1][0,2]  ← 上段横
ライン②: [1,0][1,1][1,2]  ← 中段横
ライン③: [2,0][2,1][2,2]  ← 下段横
ライン④: [0,0][1,1][2,2]  ← 左上→右下斜め
ライン⑤: [2,0][1,1][0,2]  ← 左下→右上斜め
```

**インターフェース:**
```js
evaluator.evaluate(grid)
// → [{ line: 1, symbol: 'BELL', payout: 30 }, ...]
evaluator.totalPayout(results)  // 合計配当を返す
```

---

### 4. CreditManager
**責務:** クレジット残高・BET額の管理

**インターフェース:**
```js
creditManager.balance          // 現在残高
creditManager.bet              // 現在BET額
creditManager.setBet(amount)   // BET額変更（1 / 3 / MAX）
creditManager.deductBet()      // スピン時にBET分を引く
creditManager.addWin(amount)   // 配当を加算
creditManager.addBonus(amount) // ベル検出ボーナスを加算
```

---

### 5. FeverGauge
**責務:** フィーバーゲージの値管理・減衰・フィーバー状態遷移

**仕様:**
- ゲージ範囲: 0〜100
- ベル検出時: +20
- 毎秒: -5（自然減衰）
- 100到達: `FEVER_START`イベント発火
- フィーバー終了後: 0にリセット

**インターフェース:**
```js
feverGauge.value               // 現在のゲージ値（0〜100）
feverGauge.onBell()            // ベル検出時に呼び出す
feverGauge.isFever             // フィーバー中かどうか
feverGauge.on('fever_start', handler)
feverGauge.on('fever_end', handler)
feverGauge.on('change', handler)  // ゲージ値変化時（UI更新用）
```

---

### 6. AudioDetector
**責務:** マイク入力を解析してベル音を検出する

**検出ロジック:**
1. `getUserMedia` でマイク入力取得
2. `AnalyserNode` で周波数スペクトル取得（FFTサイズ: 2048）
3. 1kHz〜4kHz 帯域のエネルギーが閾値を超えたら検出
4. クールダウン 500ms（連続誤検知防止）

**インターフェース:**
```js
audioDetector.start()          // マイク起動（パーミッション要求含む）
audioDetector.stop()           // マイク停止
audioDetector.on('bell', handler)  // ベル検出イベント
audioDetector.sensitivity      // 感度設定（0.0〜1.0）
```

---

### 7. BellSimulator（Phase1専用）
**責務:** AudioDetectorの代替として、ボタン操作でベルイベントを発火させる

**インターフェース:** AudioDetector と同一（差し替え可能な設計）
```js
bellSimulator.on('bell', handler)
// ボタン押下で 'bell' イベントを発火
```

> Phase2以降は AudioDetector に差し替えるだけで動作する。

---

### 8. UIRenderer
**責務:** ゲーム状態を受け取り、画面を描画・更新する

**担当領域:**
- リールアニメーション（CSS transition or Canvas）
- クレジット・BET残高表示
- フィーバーゲージバー
- 当選ライン演出（ハイライト + フラッシュ）
- ベル検出フィードバック（光エフェクト）
- フィーバー演出（背景変化・パーティクル）

**方針:** 描画ロジックはロジック層（StateMachine等）から完全分離し、イベント駆動で更新する。

---

## ユニット間の依存関係まとめ

| ユニット | 依存先 |
|----------|--------|
| GameStateMachine | ReelEngine, CreditManager, FeverGauge |
| ReelEngine | PaylineEvaluator |
| FeverGauge | AudioDetector / BellSimulator |
| UIRenderer | GameStateMachine（イベント購読のみ） |
| AudioDetector | Web Audio API（外部） |
