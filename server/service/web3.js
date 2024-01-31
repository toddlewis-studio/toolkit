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
const HeliusNet = '' /*HELIUS API KEY HERE*/ // Ouch, my wallet (prod)

const MainKeypair = require('../asset/solkeypair.js')
const MainPubkey = new sw3.PublicKey(MainKeypair._keypair.publicKey)

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
 
const ata = async (mintPubkey, forPubkey) => {
  const ata = await spl.getOrCreateAssociatedTokenAccount(
    ConnectionNet(true),
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
  console.log(`|-\n|Balance:\n|    For:${pubkey.toString()}\n|    SOL:${await connection.getBalance(pubkey)}`)

  if(tokenAccounts.value.length){
    console.log("|    Token                                         Balance")
    console.log("|    ------------------------------------------------------------")
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = spl.AccountLayout.decode(tokenAccount.account.data)
      console.log(`|    ${new sw3.PublicKey(accountData.mint)}   ${accountData.amount}`)
    })
  }
  console.log('|-')
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
  let senderATA = await ata(mintPubkey, MainPubkey)
  console.log('sender', senderATA)
  let recieverATA = await ata(mintPubkey, to)
  console.log('reciever', recieverATA)
  const txhash = await spl.transfer(
    connection, // connection
    MainKeypair, // payer
    senderATA.address, // from (should be a token account)
    recieverATA.address, // to (should be a token account)
    MainPubkey, // from's pubkey
    amount || 1 // amount, if your deciamls is 8, send 10^8 for 1 token
  )
  console.log(`token${(amount && amount > 1 ? 's' : '')} sent`)
  return txhash
}

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
  initTestMode,

  MainKeypair,
  MainPubkey,
  ConnectionNet,
  
  metaplex,
  pubkey: val => new sw3.PublicKey(val),
  keypair,
}
