const sw3 = require('@solana/web3.js')
const admin = require("firebase-admin")

const keys = {}

/*HELIUS API KEY HERE*/  
keys.HeliusNet = 
  'https://rpc.helius.xyz/?api-key=' 

//Firebase > Project Settings > Service Accounts > privatekey 
keys.Firebase = 
  {
    credential: admin.credential.cert({
      "type": "",
      "project_id": "",
      "private_key_id": "",
      "private_key": "",
      "client_email": "",
      "client_id": "",
      "auth_uri": "",
      "token_uri": "",
      "auth_provider_x509_cert_url": "",
      "client_x509_cert_url": "",
      "universe_domain": ""
    }),
    databaseURL: ''
  }

//main wallet keypair
keys.Keypair =
  sw3.Keypair.fromSecretKey(
    Uint8Array.from([])
  )

module.exports = keys
