//libs
const
  express = require('express'),
  path = require('path'),
  bodyParser = require('body-parser'),
  app = express(),
  cors = require('cors'),
  fs = require('fs')

//config
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true })) //support x-www-form-urlencoded
app.use(bodyParser.json())

//host www folder
const isWin = process.platform === "win32";
const osPath = path => isWin ? path.split('/').join('\\') : path

const WWW = __dirname.replace('server/util', 'www').replace('server\\util', 'www')
const resource = path => osPath(`${WWW}/${path}`)
app.use(express.static(WWW))
app.get('*', (req, res) => res.sendFile(resource('index.html')))

//server
const server = {}

server.serve = port => {
  let appServer = app.listen( port, 
    () => console.log(`Server Started [${appServer.address().port}]`)
  )
  return appServer
}

server.post = (path, fn) =>
  app.post('/' + path, async (req, res) => {
    let val = fn(req.body, req)
    if(val.then)
      val = await val
    res.send(JSON.stringify(val || { error: true, msg: 'No Response.' }))
    res.end()
  })

server.get = (path, fn, type) =>
  app.get('/' + path, (req, res) => {
    if(type)
      res.type(type)
    res.send(JSON.stringify(fn(req.query, req) || { error: true, msg: 'No Response.' }))
    res.end()
  })

module.exports = server