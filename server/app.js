const server = require('./util/server.js')

/* services */
require('./service/service.js')
require('./service/db.js')
require('./service/w3validate.js')
require('./service/web3.js')

/* routes */

/* start server */
server.serve('4200')