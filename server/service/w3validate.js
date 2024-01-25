const service = require('./service.js')
const sw3 = require('@solana/web3.js')
const Buffer = require('buffer')
const fetch = require('node-fetch')
const { Metaplex, findMetadataPda, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const { AccountLayout, TOKEN_PROGRAM_ID} = require("@solana/spl-token")
const prod = require('../../isprod.js')

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
  : PaymentNet
)

service.w3valid = {}

// if you setup a signature/${table}/${signatureID} this is useful, else delete or sm
// service.w3valid.validateSignatureCompletion = async (table, signature) => {
//   const status = await service.db.read(`/signature/${table}/${signature}`)
//   if(status) return {error: 'Signature tx already completed.'}
//   return {}
// }

service.w3valid.validateOwnership = async (userPubkey, nftPubkey) => {
  //validate user owns mb
  const nfts = await service.w3valid.nfts(new sw3.PublicKey(userPubkey))
  const isOwned = nfts.find(obj => obj.address.toString() === nftPubkey)
  return isOwned
}

service.w3valid.validateSignatureOnWallet = async (signature, wallet) => {
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

service.w3valid.transactionDetails = async (signature) => {
  const connection = solConnection()
  const res = await connection.getParsedTransaction(signature)
  return res
}

service.w3valid.validateTx = async (txId, userPubkey) => {
  //validate pubkey sent finished tx
  console.log('validate', userPubkey, MainPubkey.toString())
  const userValid = await service.w3valid.validateSignatureOnWallet(txId, userPubkey)
  if(userValid.error) return userValid
  const tlValid = await service.w3valid.validateSignatureOnWallet(txId, MainPubkey.toString())
  if(tlValid.error) return tlValid
  const details = await service.w3valid.transactionDetails(txId)
  console.log(details)

  const senderAmount = details.meta.postBalances[0] - details.meta.preBalances[0]
  const receiverAmount = details.meta.postBalances[1] - details.meta.preBalances[1]
  
  return {sent: receiverAmount}
}

service.w3valid.validateNFT = async (txId, userPubkey) => {
  //validate pubkey sent finished tx
  console.log('validate nft', userPubkey, MainPubkey.toString())
  const details = await service.w3valid.transactionDetails(txId)
  
  const senderPre = details.meta.preTokenBalances.find(detail => detail.owner === userPubkey)
  const senderPost = details.meta.postTokenBalances.find(detail => detail.owner === userPubkey)
  const receiverPost = details.meta.postTokenBalances.find(detail => detail.owner === MainPubkey.toString())

  if(!senderPre || !senderPost) {
    console.error('Invalid NFT TX', details)
    return {error: 'Invalid NFT TX', details}
  }

  const mint = senderPre.mint
  const res = await service.w3valid.nftInfo(new sw3.PublicKey(mint))
  if(!res) return console.error('invalid nft info')
  const nft = res[0] 

  const sent = receiverPost.uiTokenAmount.amount === '1'
  if(!sent) return console.error('issue reading nft balance')
  
  return {valid: true, nft}
}

service.w3valid.nfts = async (...mints) => {
  const connection = ownerNet()

  const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(MainPubkey))
      .use(bundlrStorage())
  
  const nfts = await metaplex.nfts().findAllByMintList({ mints })

  return nfts
}

service.w3valid.nftsWithData = async (pubkey, filter) => {
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

service.w3valid.getOwner = async tokenPubkey => {
  const connection = ownerNet()
  const data = await connection.getTokenLargestAccounts(new sw3.PublicKey(tokenPubkey))
  const ownerTokenKey = data.value[0].address
  const parsedData = await connection.getParsedAccountInfo(ownerTokenKey)
  const owner = parsedData.value.data.parsed.info.owner
  return owner
}

module.exports = service.w3valid
