var _data = require('./data')
var helpers = require('./helpers')

var handlers = {}

handlers.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}

handlers._users = {}

handlers._users.post = function(data, callback) {
  var firstName =
    typeof data.payload.firstName === 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false
  var lastName =
    typeof data.payload.lastName === 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false
  var phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false
  var password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false
  var tosAgreement =
    typeof data.payload.tosAgreement === 'boolean' &&
    data.payload.tosAgreement === true
      ? true
      : false

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users', phone, function(err, data) {
      if (err) {
        var hashedPassword = helpers.hash(password)

        if (hashedPassword) {
          var userObject = {
            firstName,
            lastName,
            hashedPassword,
            phone,
            tosAgreement: true,
          }

          _data.create('users', phone, userObject, function(err) {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { Error: 'Could not create a new user' })
            }
          })
        } else {
          callback(500, { Error: 'Could not hash the user password' })
        }
      } else {
        callback(400, { Error: 'A user with this phone number already exists' })
      }
    })
  } else {
    callback(400, { Error: 'Missing required fields' })
  }
}

handlers._users.get = function(data, callback) {}

handlers._users.put = function(data, callback) {}

handlers._users.delete = function(data, callback) {}

handlers.ping = function(data, callback) {
  callback(200)
}

handlers.notFound = function(data, callback) {
  callback(404)
}

module.exports = handlers
