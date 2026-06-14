import { CreditManager } from './CreditManager.js';
import { FeverGauge } from './FeverGauge.js';
import { ReelEngine } from './ReelEngine.js';
import { PaylineEvaluator } from './PaylineEvaluator.js';
import { BellSimulator } from './BellSimulator.js';
import { AudioDetector } from './AudioDetector.js';
import { GameStateMachine, STATE } from './GameStateMachine.js';
import { ReelAnimator } from './ReelAnimator.js';

const SYMBOLS = {
  '7':      '7️⃣',
  'BELL':   '🔔',
  'CHERRY': '🍒',
  'WATER':  '💧',
  'BAR':    '🎰',
};

// リール停止タイミング
const FAST_SPIN_MS  = 700;  // 全リール高速回転する最低時間
const STAGGER_MS    = 280;  // 各リール停止の時間差

// --- DOM構築 ---
document.querySelector('#app').innerHTML = `
  <h1>🎰 777</h1>

  <div class="mic-bar" id="mic-bar">
    <span id="mic-status">🎤 マイクOFF（シミュレータ使用中）</span>
    <button class="btn-mic" id="btn-mic">マイクをONにする</button>
  </div>

  <div class="fever-wrap">
    <div class="fever-label">
      <span>FEVER GAUGE</span>
      <span id="fever-pct">0%</span>
    </div>
    <div class="fever-bar-bg">
      <div class="fever-bar" id="fever-bar"></div>
    </div>
  </div>

  <div class="cabinet" id="cabinet">
    <div class="reels" id="reels"></div>

    <div class="info-row">
      <span>CREDIT: <strong id="balance">100</strong></span>
      <span>BET: <strong id="bet">1</strong></span>
      <span>WIN: <strong id="win">0</strong></span>
    </div>

    <div class="controls">
      <button class="btn-bet" id="bet1" data-bet="1">BET 1</button>
      <button class="btn-bet" id="bet3" data-bet="3">BET 3</button>
      <button class="btn-bet" id="betmax" data-bet="10">MAX</button>
    </div>
    <div class="controls">
      <button class="btn-spin" id="btn-spin">SPIN ▶</button>
      <button class="btn-bell" id="btn-bell">🔔 ベル</button>
    </div>

    <div class="message" id="message"></div>
  </div>
`;

// --- インスタンス ---
const credit   = new CreditManager(100);
const fever    = new FeverGauge();
const reel     = new ReelEngine();
const eval_    = new PaylineEvaluator();
const state    = new GameStateMachine();
let bell       = new BellSimulator();
let usingMic   = false;

// --- DOM参照 ---
const reelsEl   = document.getElementById('reels');
const balanceEl = document.getElementById('balance');
const betEl     = document.getElementById('bet');
const winEl     = document.getElementById('win');
const msgEl     = document.getElementById('message');
const feverBar  = document.getElementById('fever-bar');
const feverPct  = document.getElementById('fever-pct');
const cabinet   = document.getElementById('cabinet');
const spinBtn   = document.getElementById('btn-spin');
const bellBtn   = document.getElementById('btn-bell');
const micBtn    = document.getElementById('btn-mic');
const micStatus = document.getElementById('mic-status');

// --- リールアニメータ初期化 ---
const animators = [];
for (let col = 0; col < 3; col++) {
  const windowEl = document.createElement('div');
  windowEl.className = 'reel-window';
  reelsEl.appendChild(windowEl);
  animators.push(new ReelAnimator(windowEl, SYMBOLS, reel.getStrip()));
}

function highlightHits(hits) {
  const lines = eval_.getLines();
  hits.forEach(({ lineIndex }) => {
    lines[lineIndex].forEach(([row, col]) => {
      animators[col].highlightRow(row);
    });
  });
}

// --- クレジット表示 ---
credit.on(({ balance, bet }) => {
  balanceEl.textContent = balance;
  betEl.textContent = bet;
  spinBtn.disabled = !credit.canBet() || !state.is(STATE.IDLE);
});

// --- フィーバーゲージ表示 ---
fever.on('change', (g) => {
  const pct = Math.round(g.value);
  feverBar.style.width = (g.isFever ? 100 : pct) + '%';
  if (g.isFever) {
    const secs = Math.ceil(g.feverTimeRemaining / 1000);
    feverPct.textContent = `🔥 ${secs}s`;
    feverBar.classList.add('full');
  } else {
    feverPct.textContent = pct + '%';
    if (pct >= 100) feverBar.classList.add('full');
    else feverBar.classList.remove('full');
  }
});

fever.on('fever_start', () => {
  reel.setFeverMode(true);
  animators.forEach(a => a.updateStrip(reel.getStrip()));
  cabinet.classList.add('fever');
  msgEl.textContent = '🔥 FEVER!! 🔥';
});

fever.on('fever_end', () => {
  reel.setFeverMode(false);
  animators.forEach(a => a.updateStrip(reel.getStrip()));
  cabinet.classList.remove('fever');
  flashMsg('FEVER終了');
});

// --- ベルイベントハンドラ ---
function onBell() {
  fever.onBell();
  credit.addBonus(1);
  flashMsg('🔔 +1 クレジット!');
}

bell.on('bell', onBell);
bellBtn.addEventListener('click', () => {
  if (!usingMic) bell.trigger();
});

// --- マイクONボタン ---
micBtn.addEventListener('click', async () => {
  micBtn.disabled = true;
  micStatus.textContent = '🎤 接続中...';
  try {
    const detector = new AudioDetector();
    await detector.start();

    bell = detector;
    bell.on('bell', onBell);
    usingMic = true;

    micStatus.textContent = '🎤 マイクON（ベル音を検出中）';
    micBtn.textContent = 'マイクをOFFにする';
    micBtn.disabled = false;
    bellBtn.style.display = 'none';

    micBtn.onclick = () => {
      detector.stop();
      usingMic = false;
      bell = new BellSimulator();
      bell.on('bell', onBell);
      micStatus.textContent = '🎤 マイクOFF（シミュレータ使用中）';
      micBtn.textContent = 'マイクをONにする';
      bellBtn.style.display = '';
      micBtn.onclick = null;
    };
  } catch (err) {
    micStatus.textContent = '🎤 マイク取得失敗（シミュレータを使用）';
    micBtn.textContent = 'マイクをONにする';
    micBtn.disabled = false;
  }
});

// --- BETボタン ---
document.querySelectorAll('.btn-bet').forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = parseInt(btn.dataset.bet);
    credit.setBet(Math.min(amount, credit.balance));
    document.querySelectorAll('.btn-bet').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
document.getElementById('bet1').classList.add('active');

// --- SPINボタン ---
spinBtn.addEventListener('click', async () => {
  if (!state.is(STATE.IDLE)) return;
  if (!credit.canBet()) return;

  state.transition(STATE.SPINNING);
  spinBtn.disabled = true;
  winEl.textContent = '0';
  msgEl.textContent = '';
  credit.deductBet();

  // 停止位置を事前決定
  reel.spin();
  const positions = reel.getPositions();

  // ハイライトをクリアして全リール回転開始
  animators.forEach(a => {
    a.clearHighlights();
    a.startSpin();
  });

  // 左→中→右の順に時間差で停止
  await Promise.all(
    animators.map((anim, col) =>
      anim.stopAt(positions[col], FAST_SPIN_MS + col * STAGGER_MS)
    )
  );

  // 当否判定
  const grid = reel.getGrid();
  const hits  = eval_.evaluate(grid);
  const total = eval_.totalPayout(hits) * credit.bet;

  if (hits.length > 0) {
    highlightHits(hits);
    credit.addWin(total);
    winEl.textContent = total;
    msgEl.textContent = total >= 100 ? '🎉 JACKPOT!! 🎉' : `WIN! +${total}`;
    fever.onWin();
  } else {
    msgEl.textContent = 'はずれ…';
  }

  state.transition(STATE.IDLE);
  updateSpinBtn();
});

function updateSpinBtn() {
  spinBtn.disabled = !credit.canBet();
}

function flashMsg(text) {
  msgEl.textContent = text;
  setTimeout(() => { if (msgEl.textContent === text) msgEl.textContent = ''; }, 1200);
}
