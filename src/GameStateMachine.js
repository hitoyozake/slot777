export const STATE = {
  IDLE: 'IDLE',
  SPINNING: 'SPINNING',
  RESULT: 'RESULT',
  FEVER: 'FEVER',
};

export class GameStateMachine {
  constructor() {
    this.current = STATE.IDLE;
    this._handlers = {};
  }

  transition(next) {
    this.current = next;
    this._handlers[next]?.forEach(fn => fn());
  }

  on(state, handler) {
    if (!this._handlers[state]) this._handlers[state] = [];
    this._handlers[state].push(handler);
  }

  is(state) {
    return this.current === state;
  }
}
