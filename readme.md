# Paint Persona

## Requirements to run:

1. Create a test firebase Realtime Database
2. Create a Solana web3 Keypair (this will be your local PaintPersonaWallet)

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

## Hackathon TODOs:
* fix mobile phantom not working
* styling
  * signup page

## Shortcuts:
* npm run frontend (will only build frontend)
* npm run server (will only build backend)
* npm run serve (will only build backend and start server)

## Diamond Battler:
* stats
  * Health
  * Protection
  * Abilities
  * Speed

* combat
  * turn based
  * each turn a que of abilities is filled and executed until a db has a health of 0 or less.
  * at the beginning of each turn, remove all previous protection and roll a new protection amount. 

* background: base hp / base speed
  * Green 6 - 1
  * Blue 4 - 2
  * Purple 4 - 3
  * Pink 6 - 1
  * Yellow 2 - 4
  * Orange 2 - 3

* body: base hp / base protection
  * Gold_Diamond 10 - 1d8
  * Pink_Heart_Diamond 6 - 1d6 
  * Green_Diamond 6 - 1d4
  * Rainbow_Complex_Diamond 4 - 1d10
  * Green_Heart_Diamond 8 - 1d4
  * Pattern_Blues_Diamond 4 - 1d8
  * Pattern_Reds_Diamond 2 - 1d12
  * LightBlue_Diamond 6 - 1d4 
  * Rainbow_Split_Diamond 4 - 1d10

  * eyes: speed / protection
    * Angry 3 - 1d6
    * Awake 4 - 1d4
    * Chill 2 - 1d8

  * hat: ability
    * Crown: Royal Tackle 1d12
    * Halo: Divine Push 1d10
    * Shine: Shiney Slap 1d8
    * None: Headbutt 1d6

  * head: ability
    * Hair_Drip_LightBlue: Plasma 1d8
    * Hair_Drip_Pink: Chew 1d8
    * Hair_Drip_Green: Slime 1d8
    * None: Vicious Mockery 1d4
    * Mellow_Drip_Purple: Toxic 1d6
    * Shadow: Backstab 1d4
    * Mellow_Drip_LightBlue: Tornado 1d6
    * Mellow_Drip_Green: Gas 1d6

  * mouth: ability
    * Gold_Grill: Swag 1d12
    * Smoke_Rainbow_Yellow: Grav Hit 1d10
    * Smoke_LightBlue: Spicy Vape 1d10
    * Smoke_Green: White Owl 1d10
    * Smoke_Rainbow_LightBlue: Cross Joint 1d10
    * Smoke_Rainbow_Pink: Torched Bowl 1d10
    * None: Meditation 1d8
    * Tongue_Pink: Bring Up Politics 1d6
    * Shadow_Low: Ritual 1d8
    * Smile: Akward Pause 1d6
    * Growl: Embarass 1d6
    * Tongue_Green: Pop Edibles 1d8

  * neck: ability
    * None: Rock Paper Scissors 1d4
    * Chain: Rap Music 1d8