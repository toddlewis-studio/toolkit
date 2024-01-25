const service = require('./service.js')
const admin = require("firebase-admin")
const { getDatabase } = require('firebase-admin/database')

const serviceAccount = require('../asset/fbkey.js')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "" //Firebase databaseURL
})

service.db = {}

service.db.write = (location, obj) => {
  const db = getDatabase()
  const ref = db.ref(location)
  return ref.set(obj)
}

service.db.push = (location, obj) => {
  const db = getDatabase()
  const ref = db.ref(location).push()
  ref.set(obj)
  return ref.key
}

service.db.pushThen = (location, obj) => {
  const db = getDatabase()
  const ref = db.ref(location).push()
  return {key: ref.key, resolve: () => ref.set(obj)}
}

service.db.read = location => {
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

service.db.limit = (location, limit) => {
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

service.db.orderRange = (location, order, start, end) => {
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

service.db.order = (location, order) => {
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

module.exports = {}