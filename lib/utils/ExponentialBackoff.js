module.exports = class ExponentialBackoff {

  constructor(props = {}) {
    this._scale = props.scale || 100;
    this._exponent = props.exponent || 2;
    this._precision = props.precision || 0.25;
    this._decimalPlaces = props.decimalPlaces || 3;
    this._max = props.max || 60000;
    this._min = props.min || 0;
  }

  calculate(attempt) {
    const backoff = this._exponent ** attempt * this._scale;
    const direction = Math.floor(Math.random() * 2) ? 1 : -1;
    const variation = direction * Math.random() * backoff * this._precision;
    const delay = Math.round(backoff + variation, this._decimalPlaces);
    return Math.max(Math.min(delay, this._max), this._min);
  }

  build() {
    return (attempt) => this.calculate(attempt);
  }
};