# Toolkit

## Requirements to run:

1. Create a test firebase Realtime Database
2. Create a Solana web3 Keypair (this will be your local MainKeypair)
3. Create a Helius API

* `/server/keys.js`
  * export {HeliusNet, Firebase, Keypair}

## To run:
* npm i
* npm run start

## To Build prod:
* webpack.config.js remove `mode: 'development'`
* toolkit.setProd(true)
