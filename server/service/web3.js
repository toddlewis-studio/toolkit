// Docs Used:
// https://spl.solana.com/token#reference-guide
// https://solana-labs.github.io/solana-web3.js/
// https://solana-labs.github.io/solana-program-library/token/js/modules.html
// https://mpl-token-metadata-js-docs.vercel.app/index.html
// https://docs.metaplex.com/programs/token-metadata/getting-started

const prod = require('../../isprod.js')
const service = require('./service.js')
const sw3 = require('@solana/web3.js')
const spl = require('@solana/spl-token')
const { Metaplex, findMetadataPda, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const Buffer = require('buffer') // unused but you GOTTA keep it here :)

const DevNet = 'https://api.devnet.solana.com' // Fake money (dev)
const MainNetBeta = 'https://api.mainnet-beta.solana.com' // Localhost (dev)
const PaymentNet = 'https://api.metaplex.solana.com/' // Metaplex (dev / prod)
const HeliusNet = 'https://rpc.helius.xyz/?api-key=bd706e2b-9ee8-49bf-a97e-f14764b99dcb' /*HELIUS API KEY HERE*/ // Ouch, my wallet (prod)

const ArweaveKey = require('../asset/arweave.js') // Arweave JWK
const MainKeypair = require('../asset/solkeypair.js')
const MainPubkey = new sw3.PublicKey(MainKeypair._keypair.publicKey)
console.log(MainPubkey)

let testMode = false// set to false in prod

const ConnectionNet = (owner) => new sw3.Connection(testMode
  ? DevNet
  : ( prod 
    ? HeliusNet 
    : (owner ? PaymentNet : MainNetBeta)
    ),
  owner ? 'confirmed' : undefined
)

const metaplex = wallet => 
  Metaplex.make(ConnectionNet())
    .use(keypairIdentity(wallet || MainKeypair))
    .use(bundlrStorage())

const mNfts = (...options) => metaplex().nfts(...options)

// TEST: create token, nft
// TEST: set metadata
// TEST: send sol, token, nft

const initTestMode = async needSol => {
  testMode = true
  console.log(MainPubkey)
  if(needSol) {
    const connection = ConnectionNet(true)
    const airdropSignature = await connection.requestAirdrop(
      MainPubkey,
      sw3.LAMPORTS_PER_SOL * 100,
    )

    await connection.confirmTransaction(airdropSignature)
  }
  console.log("TEST MODE")
}

const keypair = () => sw3.Keypair.generate()

const createMint = async (ownerPubkey, payerKeypair, decimal) => {
  const connection = ConnectionNet(true)
  
  const mint = await spl.createMint(
    connection,
    payerKeypair,
    ownerPubkey,
    ownerPubkey,
    decimal || 0
  )

  return mint
}

const mintInfo = async mintPubkey => spl.getMint(
  ConnectionNet(true),
  mintPubkey
)  
 
const ata = async (mintPubkey, forPubkey, connection) => {
  const ata = await spl.getOrCreateAssociatedTokenAccount(
    connection || ConnectionNet(true),
    MainKeypair,
    mintPubkey,
    forPubkey
  )

  return ata
}

const ataInfo = ata => spl.getAccount(ConnectionNet(true), ata.address)

const mintToken = async (mintPubkey, toATA, payerKeypair, ownerKeypair, amount) => {
  const res = await spl.mintTo(
    ConnectionNet(true),
    payerKeypair,
    mintPubkey,
    toATA.address,
    ownerKeypair,
    amount
  )

  console.log('minted', res)
  return res
}

const balance = async pubkey => {
  const connection = ConnectionNet()
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    pubkey,
    { programId: spl.TOKEN_PROGRAM_ID }
  )
  console.log('|----------------------------------------------------------------')
  console.log(`|--- Balance ----------------------------------------------------\n|`)
  console.log(`|    ${pubkey.toString()}\n|    ${await connection.getBalance(pubkey)} SOL\n|`)

  if(tokenAccounts.value.length){
    console.log("|    Token                                          Balance")
    console.log("|    ------------------------------------------------------------")
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = spl.AccountLayout.decode(tokenAccount.account.data)
      console.log(`|    ${new sw3.PublicKey(accountData.mint)}   ${accountData.amount}`)
    })
  }
  console.log('|\n|----------------------------------------------------------------')
}


const mintNFTOld = async (mintPubkey, toATA, payerKeypair, ownerKeypair) => {
  const connection = ConnectionNet(true)
  const res = mintToken(mintPubkey, toATA, payerKeypair, ownerKeypair, 1)

  const removeAuthTx = new sw3.Transaction()
    .add(spl.createSetAuthorityInstruction(
      mintPubkey,
      MainPubkey,
      spl.AuthorityType.MintTokens,
      null
    ))

  await sw3.sendAndConfirmTransaction(connection, removeAuthTx, [MainKeypair])
}

const mintNFT = async settings => {
  // mint settings below
  // https://metaplex-foundation.github.io/js/types/js.CreateNftInput.html
  console.log('minting nft...')
  const nft = await mNfts().create(settings)
  console.log('minting complete')
  return nft
}

const sendSol = async (amount, fromKeypair, toPubkey) => {
  const connection = ConnectionNet(true)
  const lamports = amount
  console.log(lamports)
  const transaction = new sw3.Transaction().add(
    sw3.SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey,
      lamports
    })
  )
  let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromKeypair.publicKey

  // Sign transaction, broadcast, and confirm
  const signature = await sw3.sendAndConfirmTransaction(connection, transaction, [fromKeypair])
  console.log('signature', signature)
  const status =  await connection.getSignatureStatus(signature)
  console.log('status', status)
  return signature
}

const sendToken = async (mintPubkey, to, amount) => {
  const connection = ConnectionNet(true)
  mintPubkey = new sw3.PublicKey(mintPubkey)
  to = new sw3.PublicKey(to)
  console.log(mintPubkey, to)
  //FROM WALLET ATA (Associated Token Address (aka the account the nft exists in inside your wallet))
  let recieverATA = await ata(mintPubkey, to, connection)
  console.log('reciever', recieverATA)
  let senderATA = await ata(mintPubkey, MainPubkey, connection)
  console.log('sender', senderATA)
  const txhash = await spl.transfer(
    connection, // connection
    MainKeypair, // payer
    senderATA.address, // from (should be a token account)
    recieverATA.address, // to (should be a token account)
    MainPubkey, // from's pubkey
    amount || 1 // amount if your deciamls is 8, send 10^8 for 1 token
  )
  console.log(`token${(amount && amount > 1 ? 's' : '')} sent`)
  return txhash
}

const sendNFT = async (mint, to) => {
  mint = new sw3.PublicKey(mint)
  to = new sw3.PublicKey(to)
  const nft = await mNfts().findByMint({mintAddress: mint})
  console.log(nft)
  const connection = ConnectionNet()
  
  const txBuilder = await mNfts().builders().transfer({
    nftOrSft: nft,
    fromOwner: MainPubkey,
    toOwner: to,
    amount: 1,
    authority: MainKeypair
  })

  const blockhash = await connection.getLatestBlockhash()
  const tx = txBuilder.toTransaction(blockhash)
  
  tx.feePayer = MainPubkey

  // Sign transaction, broadcast, and confirm
  const signature = await sw3.sendAndConfirmTransaction(connection, tx, [MainKeypair])
  console.log('signature', signature)
  const status =  await connection.getSignatureStatus(signature)
  console.log('status', status)
  return signature
}

// const uploadPNG = async (url) => {
//   // load the data from disk
//   const imageData = fs.readFileSync(url)

//   // create a data transaction
//   let transaction = await arweave.createTransaction({
//     data: imageData
//   }, ArweaveKey)

//   // add a custom tag that tells the gateway how to serve this data to a browser
//   transaction.addTag('Content-Type', 'image/png')

//   // you must sign the transaction with your key before posting
//   await arweave.transactions.sign(transaction, key)

//   // create an uploader that will seed your data to the network
//   let uploader = await arweave.transactions.getUploader(transaction)

//   // run the uploader until it completes the upload.
//   while (!uploader.isComplete) {
//     await uploader.uploadChunk()
//   }
// }

module.exports = service.web3 = {
  createMint,
  mintInfo,
  ata,
  ataInfo,
  balance,
  mintToken,
  mintNFT,
  sendSol,
  sendToken,
  sendNFT,
  initTestMode,

  MainKeypair,
  MainPubkey,
  ConnectionNet,
  
  metaplex,
  pubkey: val => new sw3.PublicKey(val),
  keypair,
}
