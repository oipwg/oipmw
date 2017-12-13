import { Wallet } from './wallet/wallet.js'
import * as Networks from './coins/networks'
import * as util from './util'

const OIPMW = {
  Wallet: Wallet,
  Networks: Networks,
  util: util
}

export default OIPMW
