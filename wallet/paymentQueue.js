function PaymentQueue (coin) {
  if (!(this instanceof PaymentQueue)) {
    console.warn('Non constructor call made to PaymentQueue.constructor')
    return new PaymentQueue(...arguments)
  }

  this.coin = coin
  this.q = []
  this.pendingSat = 0
  this.totalFeeSat = 0
  this.cachedTX = []
  this.stale = false
}

PaymentQueue.prototype.add = function (options) {
  let {
    outputSat = {},
    txComment = '',
    amountSat,
    feeSat,
    fee
  } = options

  this.stale = true
  this.pendingSat += feeSat + amountSat
  this.totalFeeSat += feeSat

  this.q.push({outputSat, txComment, amountSat, fee, feeSat})

  return Promise.resolve()
}

PaymentQueue.prototype._buildCacheTX = function () {
  if (!this.stale) {
    return
  }

  let noCom = {
    feeSat: 0,
    outputSat: {},
    amountSat: 0
  }
  let com = []

  // for each queued item in the queue
  for (let qi of this.q) {
    // can't merge txComments
    if (qi.txComment !== '') {
      com.push(qi)
      continue
    }

    noCom.feeSat += qi.feeSat
    noCom.amountSat += qi.amountSat

    // for each output in this queued items output set
    for (let o in qi.outputSat) {
      if (!qi.outputSat.hasOwnProperty(o)) {
        continue
      }

      if (noCom.outputSat[o]) {
        noCom.outputSat[o] += qi.amountSat
      } else {
        noCom.outputSat[o] = qi.amountSat
      }
    }
  }

  for (let ct of com) {
    let btOptions = {
      fee: ct.fee,
      outputSat: ct.outputSat,
      txComment: ct.txComment,
      amountSat: ct.amountSat,
      feeSat: ct.feeSat
    }
    this.cachedTX.push(this.coin._buildTX(btOptions))
  }

  if (noCom.amountSat > 0 || noCom.feeSat > 0) { this.cachedTX.push(this.coin._buildTX(noCom)) }

  this.stale = false
}

PaymentQueue.prototype.estimateFee = function () {
  this._buildCacheTX()
  return this.totalFeeSat
}

PaymentQueue.prototype.sendAll = function () {
  this._buildCacheTX()

  if (this.cachedTX.length === 0) {
    return Promise.resolve([])
  }

  let t = this.cachedTX.reduce(
    (o, ctx) => {
      return {
        res: o.res,
        p: o.p.then(() =>
          this.coin._directSendPayment(ctx).then(
            (res) => {
              o.res.push(res)
              return Promise.resolve(o)
            }
          )
        )
      }
    }, {res: [], p: Promise.resolve()}
  )

  return t.p.then(o => o.res)
}

module.exports = PaymentQueue
