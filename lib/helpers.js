var crypto = require('crypto')
var config = require('./config')
var https = require('https')
var querystring = require('querystring')
var path = require('path')
var fs = require('fs')

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

helpers.sendTwilioSms = function(phone, msg, callback) {
  phone =
    typeof phone === 'string' && phone.trim().length === 10
      ? phone.trim()
      : false
  msg =
    typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length < 1600
      ? msg.trim()
      : false
  if (phone && msg) {
    var payload = {
      From: config.twilio.fromPhone,
      To: '+1' + phone,
      Body: msg,
    }

    var stringPayload = querystring.stringify(payload)

    var requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'post',
      path:
        '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      auth: config.twilio.accountSid + ':' + config.twilio.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    }

    var req = https.request(requestDetails, function(res) {
      var status = res.statusCode

      if (status === 200 || status === 201) {
        callback(false)
      } else {
        callback('Status code returned was ' + status)
      }
    })

    req.on('error', function(e) {
      callback(e)
    })

    req.write(stringPayload)

    req.end()
  } else {
    callback('Given parameters were missing or invalid')
  }
}

helpers.getTemplate = function(templateName, data, callback) {
  templateName =
    typeof templateName === 'string' && templateName.length > 0
      ? templateName
      : false
  data = typeof data === 'object' && data !== null ? data : {}

  if (templateName) {
    var templatesDir = path.join(__dirname, '/../templates/')
    fs.readFile(templatesDir + templateName + '.html', 'utf8', function(
      err,
      str
    ) {
      if (!err && str && str.length > 0) {
        var finalString = helpers.interpolate(str, data)
        callback(false, finalString)
      } else {
        callback('No template could be found')
      }
    })
  } else {
    callback('A valid template name was not specified')
  }
}

helpers.addUniversalTemplates = function(str, data, callback) {
  str = typeof str === 'string' && str.length > 0 ? str : ''
  data = typeof data === 'object' && data !== null ? data : {}

  helpers.getTemplate('_header', data, function(err, headerString) {
    if (!err && headerString) {
      helpers.getTemplate('_footer', data, function(err, footerString) {
        if (!err && footerString) {
          var fullString = headerString + str + footerString
          callback(false, fullString)
        } else {
          callback('Could not find the footer template')
        }
      })
    } else {
      callback('Could not find the header template')
    }
  })
}

helpers.interpolate = function(str, data) {
  str = typeof str === 'string' && str.length > 0 ? str : ''
  data = typeof data === 'object' && data !== null ? data : {}

  for (var keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data['global.' + keyName] = config.templateGlobals[keyName]
    }
  }

  for (var key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
      var replace = data[key]
      var find = '{' + key + '}'
      str = str.replace(find, replace)
    }
  }
  return str
}

helpers.getStaticAsset = function(fileName, callback) {
  fileName =
    typeof fileName === 'string' && fileName.length > 0 ? fileName : false
  if (fileName) {
    var publicDir = path.join(__dirname, '/../public/')
    fs.readFile(publicDir + fileName, function(err, data) {
      if (!err && data) {
        callback(false, data)
      } else {
        callback('No file could be found')
      }
    })
  } else {
    callback('A real filename wasnt specified')
  }
}

module.exports = helpers
