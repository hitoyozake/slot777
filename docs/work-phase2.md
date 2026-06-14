# Phase2 作業ログ（音声入力・Web Audio API）

Issue: #3

## 完了した作業

- [x] `src/AudioDetector.js` — Web Audio API によるベル音検出
  - `getUserMedia` でマイク入力取得
  - `AnalyserNode` (FFTサイズ 2048) で周波数スペクトル取得
  - 1kHz〜4kHz 帯域の最大振幅が閾値（80/255）を超えたら検出
  - クールダウン 500ms で誤検知防止
  - BellSimulator と同一インターフェース（`.on('bell', handler)`）
- [x] `src/main.js` — マイクUI・AudioDetector への動的切り替え
  - マイクON/OFFトグルボタン
  - iOS Safari の AudioContext 制約対応（ボタンタップ後に初期化）
  - マイク取得失敗時はシミュレータにフォールバック
  - マイクON中はシミュレータボタンを非表示
- [x] `src/style.css` — マイクバーUI追加

## 検出パラメータ（調整方法）

`src/AudioDetector.js` の先頭定数で変更可能:

| 定数 | デフォルト | 説明 |
|------|-----------|------|
| `DETECT_FREQ_LOW` | 1000 Hz | 検出帯域の下限 |
| `DETECT_FREQ_HIGH` | 4000 Hz | 検出帯域の上限 |
| `AMPLITUDE_THRESHOLD` | 80 | AnalyserNode の 0〜255 スケールでの閾値 |
| `COOLDOWN_MS` | 500 | 検出後の再検知抑制期間（ms） |

くるくるチャイムの実機でテストし、誤検知が多い場合は `AMPLITUDE_THRESHOLD` を上げる（例: 100〜120）。
検出されにくい場合は下げるか `DETECT_FREQ_LOW` を広げる。

## 未対応（Phase3以降）

- [ ] フィーバー中の確率上昇・専用演出の強化
- [ ] 「ベルを鳴らせ！」促進アニメーション
- [ ] 絵柄・サウンドエフェクトのアセット整備
- [ ] 確率テーブルのバランス調整
- [ ] PWA対応（manifest.json, service worker）

## 次の作業者へ

### 感度調整の手順

1. デバイスにくるくるチャイムを近づけてベルを鳴らす
2. ブラウザのコンソールで振幅ピーク値を確認したい場合は、
   `AudioDetector.js` の `_loop()` 内に `console.log(peak)` を一時追加する
3. `AMPLITUDE_THRESHOLD` をピーク値の 70〜80% 程度に設定する

### Phase3 で追加すべき主な機能

1. **フィーバー演出強化** — パーティクルエフェクト、BGM切り替え
2. **「ベルを鳴らせ！」演出** — ゲージが減り始めたら点滅でユーザーを煽る
3. **確率テーブル調整** — `ReelEngine.js` の `REEL_STRIP` / `FEVER_REEL_STRIP`
4. **SE追加** — `assets/sounds/` に配置し、Web Audio API または `<audio>` タグで再生
