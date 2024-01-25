# Sol

## Requirements to run:

1. Create a test firebase Realtime Database
2. Create a Solana web3 Keypair (this will be your local MainKeypair)

* `/www/service/db_key.js`
  * export Firebase config object
* `/server/asset/fbkey.js`
  * export Firebase Admin SDK private key
* `/server/service/db.js`
  * change databaseURL to firebase database url
* `/server/asset/solkeypair.js`
  * export solana web3 Keypair object
* `/server/service/web3.js`
  * change `HeliusNet` to your helius api key
* `/web/service/w3.js`
  * change `HeliusNet` to your helius api key

## To run:
* npm i
* npm run refresh
* http://localhost:4200

## To Build prod:
* webpack.config.js remove `mode: 'development'`
* webpack.frontend.js remove `mode: 'development'`
* isprod.js export true

## Shortcuts:
* npm run frontend (will only build frontend)
* npm run server (will only build backend)
* npm run serve (will only build backend and start server)
