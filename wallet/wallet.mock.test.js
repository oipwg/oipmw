const Wallet = require('./wallet')

jest.mock('../coins/explorers/insight')

test.skip('wallet payto', () => {
  jest.setTimeout(60 * 1000)
  expect.hasAssertions()

  let wal = new Wallet('75c1209-dbcac5a6-e040977-64a52ae', 'PublicDevAccount')

  return wal.load().then(() => {
    return wal.refresh().then(() => {
      return wal.payTo('FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 'FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s', 10, 0.01, 'hello world')
        .then((res) => {
          expect(res.txid).toBe('a6aeef470d822cf58f40a20ccfa389084434f535f2c79684158d2d60a6018307')
        })
    })
  })
})

// ToDo: Mock insight for further testing, it worked live with the below but will fail in future runs

/*
Array[2][
  {
    "address": "FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s",
    "txid": "e12803c36c34046b15ea6c8a1494b23a3626b6e2ad6dfdcd84ac72ab947e97dc",
    "vout": 0,
    "ts": 1510255063,
    "scriptPubKey": "76a9144f3a411d38966b259484338306c46924e616b53388ac",
    "amount": 9.999,
    "confirmations": 6,
    "confirmationsFromCache": true
  },
  {
    "address": "FD42dYEYLfsdr88ukVZ9Pf3rDYs75McM7s",
    "txid": "cdf9581d413286dc1c6ccb7d2b0ca105879c29932364668d579ed2621dffe60a",
    "vout": 0,
    "ts": 1510069808,
    "scriptPubKey": "76a9144f3a411d38966b259484338306c46924e616b53388ac",
    "amount": 1,
    "confirmations": 6,
    "confirmationsFromCache": true
  }
] */

// 0200000002dc977e94ab72ac84cdfd6dade2b626363ab294148a6cea156b04346cc30328e1000000006a473044022035fd738fb91fcb319475891733903580f90fbfdbd6e77de59a2e35f7cecc02db022019398a81f04bacad74f0431e8c1a5132989c0460b831911da9571ce924ef7705012102dc2fc6047922bd4ddf0561e9935289612b5205a1ba465315f9e467298743f4b0ffffffff0ae6ff1d62d29e578d66642393299c8705a10c2b7dcb6c1cdc8632411d58f9cd000000006b4830450221008ab87acbc1e095ad06a28ed1a8f10132e376b71cc54b3102784f9de28e21c48c0220343673063b96e6b28f27256b07fab581eda9210a18aa42b561c1cea8f0a8a5b3012102dc2fc6047922bd4ddf0561e9935289612b5205a1ba465315f9e467298743f4b0ffffffff0120e27f41000000001976a9144f3a411d38966b259484338306c46924e616b53388ac000000000b68656c6c6f20776f726c64
