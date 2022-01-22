var crypto = require('crypto')
var config = require('./config')

var helpers = {}

helpers.hash = function(str) {
  if (typeof str === 'string' && str.length) {
    var hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex')
    return hash
  } else {
    return false
  }
}

helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str)
    return obj
  } catch (e) {
    return {}
  }
}

helpers.createRandomString = function(strLength) {
  if (typeof strLength === 'number' && strLength > 0 ? strLength : false)
    if (strLength) {
      var possibleCaracters = 'abcd1234567890'

      var str = ''

      for (i = 1; i <= strLength; i++) {
        var randomCharacter = possibleCaracters.charAt(
          Math.floor(Math.random() * possibleCaracters.length)
        )

        str += randomCharacter
      }

      return str
    } else {
      return false
    }
}

module.exports = helpers
