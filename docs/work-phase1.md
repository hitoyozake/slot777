# Phase1 作業ログ（コアスロット実装）

Issue: #1

## 完了した作業

- [x] Vite 5 (Vanilla JS) プロジェクトセットアップ
- [x] `src/CreditManager.js` — クレジット残高・BET管理
- [x] `src/PaylineEvaluator.js` — 5ライン当たり判定・配当計算
- [x] `src/ReelEngine.js` — 3列リール・通常/フィーバー用シンボルストリップ
- [x] `src/FeverGauge.js` — ゲージ管理・自然減衰・フィーバー状態遷移
- [x] `src/BellSimulator.js` — ボタン操作でベルイベントを発火するシミュレータ
- [x] `src/GameStateMachine.js` — IDLE / SPINNING / RESULT / FEVER 状態管理
- [x] `src/main.js` — 全ユニットを統合するエントリポイント + DOM制御
- [x] `src/style.css` — レスポンシブUI・フィーバー演出・アニメーション

## 未対応（Phase2以降）

- [ ] `src/AudioDetector.js` — Web Audio API によるマイク入力とベル音検出
  - BellSimulator と同一インターフェース（`.on('bell', handler)`）なので差し替えるだけでOK
- [ ] マイクパーミッション取得UI
- [ ] PWA対応（manifest.json, service worker）

## ディレクトリ構成

```
slot777/
├── src/
│   ├── main.js              # エントリポイント・DOM統合
│   ├── style.css            # スタイル
│   ├── GameStateMachine.js  # 状態管理
│   ├── ReelEngine.js        # リール制御
│   ├── PaylineEvaluator.js  # 当たり判定
│   ├── CreditManager.js     # クレジット管理
│   ├── FeverGauge.js        # フィーバーゲージ
│   └── BellSimulator.js     # ベルシミュレータ（Phase1専用）
├── index.html
├── package.json
└── docs/
    └── work-phase1.md       # 本ファイル
```

## 次の作業者へ

### Phase2 実装手順

1. `src/AudioDetector.js` を新規作成する
   - `BellSimulator` と同じ `.on('bell', handler)` インターフェースを実装する
   - `getUserMedia` → `AnalyserNode` → 1kHz〜4kHz帯域のエネルギー閾値検出
   - クールダウン 500ms を入れて誤検知を防ぐ

2. `main.js` の `BellSimulator` を `AudioDetector` に差し替える
   ```js
   // Before (Phase1)
   import { BellSimulator } from './BellSimulator.js';
   const bell = new BellSimulator();

   // After (Phase2)
   import { AudioDetector } from './AudioDetector.js';
   const bell = new AudioDetector();
   await bell.start(); // マイク起動
   ```

3. マイク許可UIをindex.htmlに追加する（UC-04参照）

### 確率テーブルの調整箇所

- `src/ReelEngine.js` の `REEL_STRIP` / `FEVER_REEL_STRIP` を編集する
- `src/PaylineEvaluator.js` の `PAYOUTS` オブジェクトで配当を変更できる

### 開発サーバー起動

```bash
npm run dev
```
