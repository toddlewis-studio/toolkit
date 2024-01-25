const prod = require('../../isprod.js')
const service = require('./service.js')
const sw3 = require('@solana/web3.js')
const spl = require('@solana/spl-token')
const Buffer = require('buffer') // unused but you GOTTA keep it here :)
service.web3 = {}

const MainNetBeta = 'https://api.mainnet-beta.solana.com'
const PaymentNet = 'https://api.metaplex.solana.com/'
const HeliusNet = '' //HELIUS API KEY

const MainKeypair = require('../asset/solkeypair.js')
const MainPubkey = MainKeypair.pubkey()

const solConnection = () => new sw3.Connection( prod
  ? HeliusNet
  : MainNetBeta
)

const ownerNet = () => new sw3.Connection( prod
  ? HeliusNet
  : PaymentNet,
  "confirmed"
)

const send_sol = async (amount, fromKeypair, toPubkey) => {
  const connection = ownerNet()
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

const send_nft = async (mintPubkey, to) => {
  const connection = ownerNet()
  mintPubkey = new sw3.PublicKey(mintPubkey)
  to = new sw3.PublicKey(to)
  console.log(mintPubkey, to)
  //FROM WALLET ATA (Associated Token Address (aka the account the nft exists in inside your wallet))
  let senderATA = await spl.getAssociatedTokenAddress(mintPubkey, MainPubkey)
  console.log('sender', senderATA)
  try {
    //try to create an ATA for the senders wallet
    recieverATA = await spl.createAssociatedTokenAccount(
      connection, // connection
      MainKeypair, // fee payer
      mintPubkey, // mint
      to // owner,
    )
  } catch(createTAError) {
    try {
      //if theres an error, they could already have an ATA for that NFT, so we try to send it
      recieverATA = await spl.getAssociatedTokenAddress(mintPubkey, to)  
    } catch(getTAError) {
      //bruh idk debug time...
      console.error('Error sending NFT')
      console.error(createTAError)
      console.error(getTAError)
      return null
    }
  }
  console.log('reciever', recieverATA)
  const txhash = await spl.transferChecked(
    connection, // connection
    MainKeypair, // payer
    senderATA, // from (should be a token account)
    mintPubkey, // mint
    recieverATA, // to (should be a token account)
    MainKeypair, // from's owner
    1, // amount, if your deciamls is 8, send 10^8 for 1 token
    0 // decimals
  )
  console.log('nft sent')
  return txhash
}

module.exports = {send_nft, send_sol}