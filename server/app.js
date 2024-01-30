const server = require('./util/server.js')

/* services */
const s = require('./service/service.js')
// require('./service/db.js')
require('./service/w3validate.js')
const w3 = require('./service/web3.js')

/* routes */

/* start server */
// server.serve('4200')

// service.web3.createMint()

const testCreateMint = async () => {
  await w3.initTestMode()
  const mint = await w3.createMint(w3.MainPubkey, w3.MainKeypair, 3)
  console.log(mint)
}

const testMintMint = async () => {
  await w3.initTestMode()
  const mint = w3.pubkey('9UEqHy255ZoCfJqji2MDcSBJ3DVwkWjR2NAiVfZ998d1')
  console.log('mint\n',mint)
  const info = await w3.mintInfo(mint)
  console.log('info\n',info)

  const MainATA = await w3.ata(mint, w3.MainPubkey)
  await w3.mintToken(
    mint,
    MainATA,
    w3.MainKeypair,
    w3.MainKeypair,
    333
  )
  const res = await w3.ataInfo(MainATA)
  console.log('ataInfo\n',res)
}

const testBalance = async () => {
  await w3.initTestMode()
  w3.balance(w3.MainPubkey)
}

const testSendCoin = async () => {
  await w3.initTestMode()
  const mint = w3.pubkey('9UEqHy255ZoCfJqji2MDcSBJ3DVwkWjR2NAiVfZ998d1')
  const sender = await w3.ata(mint, w3.MainPubkey)

  const newGuy = w3.keypair()
  const to = newGuy.publicKey
  console.log('new guy\n', to)
  const res = await w3.sendToken(mint, to, 9)
  console.log('res\n', res)
  w3.balance(w3.MainPubkey)
  w3.balance(to)
}

const testNFT = async () => {
  await w3.initTestMode()
  const mint = await w3.createMint(w3.MainPubkey, w3.MainKeypair)
  console.log(mint)
  const ata = await w3.ata(mint, w3.MainPubkey)
  const nft = await w3.mintNFT(
    mint,
    ata,
    w3.MainKeypair,
    w3.MainKeypair
  )

  await w3.balance(w3.MainPubkey)
  
  const newGuy = w3.keypair()
  const to = newGuy.publicKey
  console.log('new guy\n', to)
  const res = await w3.sendToken(mint, to, 1)
  console.log('res\n', res)
  w3.balance(w3.MainPubkey)
  w3.balance(to)
}
testNFT()
