// Docs Used:
// https://firebase.google.com/docs/database/admin/start
// https://spl.solana.com/token#reference-guide
// https://solana-labs.github.io/solana-web3.js/
// https://solana-labs.github.io/solana-program-library/token/js/modules.html
// https://mpl-token-metadata-js-docs.vercel.app/index.html
// https://docs.metaplex.com/programs/token-metadata/getting-started

const admin = require("firebase-admin")
const { getDatabase } = require('firebase-admin/database')

const sw3 = require('@solana/web3.js')
const spl = require('@solana/spl-token')
const { Metaplex, findMetadataPda, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const Buffer = require('buffer') // unused but you GOTTA keep it here :)

const DevNet = 'https://api.devnet.solana.com' // Fake money (dev)
const MainNetBeta = 'https://api.mainnet-beta.solana.com' // Localhost (dev)
const PaymentNet = 'https://api.metaplex.solana.com/' // Metaplex (dev / prod)

let 
HeliusNet, MainKeypair, MainPubkey,
testMode = false, // set to false in prod
keys, //HeliusNet, Keypair, Firebase 
prod = false

const setKeys = k => {
  keys = k
  HeliusNet = keys.HeliusNet
  MainKeypair = keys.Keypair
  MainPubkey = new sw3.PublicKey(MainKeypair._keypair.publicKey)
  console.log(MainPubkey)
  admin.initializeApp(keys.Firebase)
}
const setProd = b => prod = b

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


/*
*
*
* Validate
*
*
*/

const validate = {}

validate.validateOwnership = async (userPubkey, nftPubkey) => {
  //validate user owns mb
  const nfts = await validate.nfts(new sw3.PublicKey(userPubkey))
  const isOwned = nfts.find(obj => obj.address.toString() === nftPubkey)
  return isOwned
}

validate.validateSignatureOnWallet = async (signature, wallet) => {
  const connection = solConnection()
  const user = new sw3.PublicKey(wallet)
  const signaturesForAddress = await connection.getSignaturesForAddress(user, {limit: 20})
  if(!signaturesForAddress || signaturesForAddress.length === 0) return {error: `No signatures found for ${wallet}`}
  const valid = signaturesForAddress.find(signatureObj => {
    if(signatureObj.signature === signature && signatureObj.confirmationStatus === 'finalized')
      return signatureObj
  })

  if(valid) return valid 
  return {error: `Signature not found (${signature}) on wallet (${wallet})`}
}

validate.transactionDetails = async (signature) => {
  const connection = solConnection()
  const res = await connection.getParsedTransaction(signature)
  return res
}

validate.validateTx = async (txId, userPubkey) => {
  //validate pubkey sent finished tx
  console.log('validate', userPubkey, MainPubkey.toString())
  const userValid = await validate.validateSignatureOnWallet(txId, userPubkey)
  if(userValid.error) return userValid
  const tlValid = await validate.validateSignatureOnWallet(txId, MainPubkey.toString())
  if(tlValid.error) return tlValid
  const details = await validate.transactionDetails(txId)
  console.log(details)

  const senderAmount = details.meta.postBalances[0] - details.meta.preBalances[0]
  const receiverAmount = details.meta.postBalances[1] - details.meta.preBalances[1]
  
  return {sent: receiverAmount}
}

validate.validateNFT = async (txId, userPubkey) => {
  //validate pubkey sent finished tx
  console.log('validate nft', userPubkey, MainPubkey.toString())
  const details = await validate.transactionDetails(txId)
  
  const senderPre = details.meta.preTokenBalances.find(detail => detail.owner === userPubkey)
  const senderPost = details.meta.postTokenBalances.find(detail => detail.owner === userPubkey)
  const receiverPost = details.meta.postTokenBalances.find(detail => detail.owner === MainPubkey.toString())

  if(!senderPre || !senderPost) {
    console.error('Invalid NFT TX', details)
    return {error: 'Invalid NFT TX', details}
  }

  const mint = senderPre.mint
  const res = await validate.nftInfo(new sw3.PublicKey(mint))
  if(!res) return console.error('invalid nft info')
  const nft = res[0] 

  const sent = receiverPost.uiTokenAmount.amount === '1'
  if(!sent) return console.error('issue reading nft balance')
  
  return {valid: true, nft}
}

validate.nfts = async (...mints) => {
  const connection = ownerNet()

  const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(MainPubkey))
      .use(bundlrStorage())
  
  const nfts = await metaplex.nfts().findAllByMintList({ mints })

  return nfts
}

validate.nftsWithData = async (pubkey, filter) => {
  const connection = ownerNet()
  const wallet = pubkey

  const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(wallet))
      .use(bundlrStorage())
  
  const tokenAccounts = await connection.getTokenAccountsByOwner(
      wallet, {programId: TOKEN_PROGRAM_ID}
  )
  let mints = []
  tokenAccounts.value.forEach(tokenAccount => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    if(accountData.amount == 1){
      const mintAddress = new sw3.PublicKey(accountData.mint)
      mints.push(mintAddress)
    }
  })
  let nfts = await metaplex.nfts().findAllByMintList({ mints })
  if(filter) nfts = await Promise.all(nfts.filter(async n => await filter(n)))

  const data = await Promise.all(nfts.map(async nft => {
    const meta = await fetch(nft.uri)
    const json = await meta.json()
    json.address = nft.mintAddress
    return json
  }))
 
  return {nfts, data}
}

validate.getOwner = async tokenPubkey => {
  const connection = ownerNet()
  const data = await connection.getTokenLargestAccounts(new sw3.PublicKey(tokenPubkey))
  const ownerTokenKey = data.value[0].address
  const parsedData = await connection.getParsedAccountInfo(ownerTokenKey)
  const owner = parsedData.value.data.parsed.info.owner
  return owner
}

/*
*
*
* Firebase
*
*
*/

const db = {}

db.write = (location, obj) => {
  const db = getDatabase()
  const ref = db.ref(location)
  return ref.set(obj)
}

db.push = (location, obj) => {
  const db = getDatabase()
  const ref = db.ref(location).push()
  ref.set(obj)
  return ref.key
}

db.pushThen = (location, obj) => {
  const db = getDatabase()
  const ref = db.ref(location).push()
  return {key: ref.key, resolve: () => ref.set(obj)}
}

db.read = location => {
  const db = getDatabase()
  const ref = db.ref(location)

  return new Promise((resolve, error) => ref.once('value', 
    (snapshot) => resolve(snapshot.val()), 
    (errorObject) =>  {
      console.error('The read failed: ' + errorObject.name) 
      error(errorObject)
    }
  ))
}

db.limit = (location, limit) => {
  const db = getDatabase()
  const ref = db.ref(location)

  return new Promise((resolve, error) => ref.limitToLast(limit).once('value', 
    (snapshot) => resolve(snapshot.val()), 
    (errorObject) => {
      console.error('The read failed: ' + errorObject.name) 
      error(errorObject)
    }
  ))
}

db.orderRange = (location, order, start, end) => {
  const db = getDatabase()
  const ref = db.ref(location)

  return new Promise((resolve, error) => ref.orderByChild(`${location}/${order}`).startAt(start).endAt(end).once('value', 
    (snapshot) => resolve(snapshot.val()),
    (errorObject) => {
      console.error('The read failed: ' + errorObject.name) 
      error(errorObject)
    }
  ))
}

db.order = (location, order) => {
  const db = getDatabase()
  const ref = db.ref(location)

  return new Promise((resolve, error) => ref.orderByChild(`${location}/${order}`).once('value', 
    (snapshot) => resolve(snapshot.val()),
    (errorObject) => {
      console.error('The read failed: ' + errorObject.name) 
      error(errorObject)
    }
  ))
}

module.exports = {
  setKeys,
  setProd,
  initTestMode,
  MainKeypair,
  MainPubkey,
  ConnectionNet,
  metaplex,
  keypair,
  pubkey: val => new sw3.PublicKey(val),
  data: {
    mintInfo,
    ata,
    ataInfo,
    balance
  },
  nft: {
    createMint,
    mintToken,
    mintNFT,
    sendSol,
    sendToken,
    sendNFT
  },
  db,
  validate,
}
