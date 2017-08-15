class Forever {
  constructor(job, concurrent = 1) {
    this._job = job;
    this._concurrent = concurrent;

    this._current = [];
  }

  run() {
    this._next();
  }

  _next() {
    if (this._current.length >= this._concurrent)
      return;

    const total = this._concurrent - this._current.length;

    for(let i = 0; i < total; i++) {
      const job = this._createNextJob();
      this._current.push(job);

      job
        .then(result => this._onFulfilled(job, null, result))
        .catch(e => this._onFulfilled(job, e || true));
    }
  }

  _onFulfilled(job, err, result) {
    this._current = this._current.filter(j => j.id !== job.id);
    this._next();
  }

  _createNextJob() {
    const job = this._createPromiseTimeout(this._job(), 10000);
    job.id = Math.random();

    return job;
  }

  _createPromiseTimeout(promise, timeout) {
    return new Promise((res, rej) => {
      promise.then(res).catch(rej);
      setTimeout(rej, timeout);
    });
  }

}


module.exports = Forever;