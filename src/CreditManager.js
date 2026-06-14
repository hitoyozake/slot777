export class CreditManager {
  constructor(initialBalance = 100) {
    this.balance = initialBalance;
    this.bet = 1;
    this._listeners = [];
  }

  setBet(amount) {
    if (amount > this.balance) return;
    this.bet = amount;
    this._emit();
  }

  deductBet() {
    this.balance -= this.bet;
    this._emit();
  }

  addWin(amount) {
    this.balance += amount;
    this._emit();
  }

  addBonus(amount) {
    this.balance += amount;
    this._emit();
  }

  canBet() {
    return this.balance >= this.bet;
  }

  on(handler) {
    this._listeners.push(handler);
  }

  _emit() {
    this._listeners.forEach(fn => fn({ balance: this.balance, bet: this.bet }));
  }
}
