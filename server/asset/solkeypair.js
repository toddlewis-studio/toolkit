const sw3 = require('@solana/web3.js')

module.exports = 

sw3.Keypair.fromSecretKey(
  Uint8Array.from(
    [107,  93, 145, 254, 124,  71,  49,  48, 210, 242,  25,
     121, 140, 112, 105, 178, 159, 139,  85, 114,  60,  16,
     71,  31,  97, 189, 170,  50, 200, 212,  59, 255, 126,
     14, 141,  63, 205, 192, 168, 118, 196,  18,   2, 224,
     116, 158,  21,  51,   9, 226, 125, 133, 133, 241, 233,
     254, 179, 251, 249, 218,  62, 176, 241, 160
    ]
  )
)
