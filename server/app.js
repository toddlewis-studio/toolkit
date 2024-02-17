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
  // await w3.initTestMode()
 
  const nft = await w3.mintNFT({
    uri: "https://toddlewis.studio/metadata/genesis-catalog.json",
    name: "Genisis Catalog",
    sellerFeeBasisPoints: 0,
    isCollection: true
  })

  console.log(nft)
  await w3.balance(w3.MainPubkey)
  
  // const newGuy = w3.keypair()
  // const to = newGuy.publicKey
  // console.log('new guy\n', to)
  // const res = await w3.sendToken(mint, to, 1)
  // console.log('res\n', res)
  // w3.balance(w3.MainPubkey)
  // w3.balance(to)
}
// testNFT()

// const test = async () => {
//   w3.balance(w3.MainPubkey)
// }
// test()

const vdayMints = async () => {
  
  // const VDAYMONEYBOY = await w3.mintNFT({
  //   uri: "https://arweave.net/XoaXJK7FuPmLaT8k2BvDUvq6MYBv4tqXEzLlmEPjBW8",
  //   name: "Valentines Money Boy #2024",
  //   sellerFeeBasisPoints: 693,
  // })

  // console.log(VDAYMONEYBOY)

  // const VDAYMONEYGIRL = await w3.mintNFT({
  //   uri: "https://arweave.net/AIqN-RWHfhmYz1ECE92iMCdkHAr8EXVc7vDZnUjkLDM",
  //   name: "Valentines Money Girl #2024",
  //   sellerFeeBasisPoints: 693,
  // })

  // console.log(VDAYMONEYGIRL)

  // const res = await w3.ata(
  //   w3.pubkey('517e3mfcHQUhx3eQchtik9efqecbDji4Y7GfVy9kQ8T8'),
  //   w3.pubkey('24ufyLS4jMkAxoUk8pPgWnournhPVfoM2Vm5PdpVJS4r')
  // )
  
  // const res = await w3.sendToken(
  //   "517e3mfcHQUhx3eQchtik9efqecbDji4Y7GfVy9kQ8T8", 
  //   "24ufyLS4jMkAxoUk8pPgWnournhPVfoM2Vm5PdpVJS4r",
  //   1
  // )

  console.log(res)

  await w3.balance(w3.MainPubkey)
}
vdayMints()

// w3.balance(w3.MainPubkey)
