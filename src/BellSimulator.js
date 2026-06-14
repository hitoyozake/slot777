export class BellSimulator {
  constructor() {
    this._handlers = [];
  }

  on(event, handler) {
    if (event === 'bell') this._handlers.push(handler);
  }

  trigger() {
    this._handlers.forEach(fn => fn());
  }
}
