var path = require('path')
var fs = require('fs')
var http = require('http')
var https = require('https')
var url = require('url')
var _data = require('./data')
var helpers = require('./helpers')
var _logs = require('./logs')
var util = require('util')
var debug = util.debuglog('workers')

var workers = {}

workers.gatherAllChecks = function() {
  _data.list('checks', function(err, checks) {
    debug('Checks: ', checks)
    if (!err && checks && checks.length > 0) {
      checks.forEach(function(check) {
        _data.read('checks', check, function(err, originalCheckData) {
          if (!err && originalCheckData) {
            workers.validateCheckData(originalCheckData)
          } else {
            debug('Error reading original check data')
          }
        })
      })
    } else {
      debug('Error: Nochecks to process')
    }
  })
}

workers.validateCheckData = function(originalCheckData) {
  originalCheckData =
    typeof originalCheckData === 'object' && originalCheckData !== null
      ? originalCheckData
      : {}
  originalCheckData.id =
    typeof originalCheckData.id === 'string' &&
    originalCheckData.id.trim().length === 20
      ? originalCheckData.id.trim()
      : false
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone === 'string' &&
    originalCheckData.userPhone.trim().length === 10
      ? originalCheckData.userPhone.trim()
      : false
  originalCheckData.protocol =
    typeof originalCheckData.protocol === 'string' &&
    ['http', 'https'].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false
  originalCheckData.url =
    typeof originalCheckData.url === 'string' &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false
  originalCheckData.method =
    typeof originalCheckData.method === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes === 'object' &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds === 'number' &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false

  originalCheckData.state =
    typeof originalCheckData.state === 'string' &&
    ['up', 'down'].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : 'down'

  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked === 'number' &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false

  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData)
  } else {
    debug('Error: One of the checks is not properly formatted. Skipping it')
  }
}

workers.performCheck = function(originalCheckData) {
  var checkOutcome = {
    error: false,
    responseCode: false,
  }

  var outcomeSent = false

  var parsedUrl = url.parse(
    originalCheckData.protocol + '://' + originalCheckData.url,
    true
  )
  var hostName = parsedUrl.hostname
  var path = parsedUrl.path

  var requestDetails = {
    protocol: originalCheckData.protocol + ':',
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  }

  var _moduleToUse = originalCheckData.protocol === 'http' ? http : https
  var req = _moduleToUse.request(requestDetails, function(res) {
    var status = res.statusCode
    checkOutcome.responseCode = status
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  req.on('error', function(e) {
    checkOutcome.error = {
      error: true,
      value: 'error',
    }

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  req.on('timeout', function(e) {
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    }

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  req.end()
}

workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
  var state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(
      checkOutcome.responseCode.toString()
    ) > -1
      ? 'up'
      : 'down'

  var alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false

  var timeOfCheck = Date.now()

  workers.log(
    originalCheckData,
    checkOutcome,
    state,
    alertWarranted,
    timeOfCheck
  )

  var newCheckData = originalCheckData
  newCheckData.state = state
  newCheckData.lastChecked = timeOfCheck

  _data.update('checks', newCheckData.id, newCheckData, function(err) {
    if (!err) {
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData)
      } else {
        debug('Check outcome has not changed, no alert needed')
      }
    } else {
      debug('Error trying to save the updates to one of the checks')
    }
  })
}

workers.alertUserToStatusChange = function(newCheckData) {
  var msg =
    'Alert: Your check for ' +
    newCheckData.method.toUpperCase() +
    ' ' +
    newCheckData.protocol +
    '://' +
    newCheckData.url +
    ' is currently ' +
    newCheckData.state

  helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
    if (!err) {
      debug('Success: SMS sent to user whos check status was changed', msg)
    } else {
      debug('Error: could not send SMS')
    }
  })
}

workers.log = function(
  originalCheckData,
  checkOutcome,
  state,
  alertWarranted,
  timeOfCheck
) {
  var logData = {
    check: originalCheckData,
    outcome: checkOutcome,
    state,
    alert: alertWarranted,
    time: timeOfCheck,
  }

  var logString = JSON.stringify(logData)

  var logFileName = originalCheckData.id

  _logs.append(logFileName, logString, function(err) {
    if (!err) {
      debug('Logging to file succeeded')
    } else {
      debug('Logging to file failed')
    }
  })
}

workers.loop = function() {
  setInterval(function() {
    workers.gatherAllChecks()
  }, 1000 * 60)
}

workers.rotateLogs = function() {
  _logs.list(false, function(err, logs) {
    if (!err && logs && logs.length) {
      logs.forEach(function(logName) {
        var logId = logName.replace('.log', '')
        var newFileId = logId + '-' + Date.now()
        _logs.compress(logId, newFileId, function(err) {
          if (!err) {
            _logs.truncate(logId, function(err) {
              if (!err) {
                debug('Success truncating log file')
              } else {
                debug('Error truncating log file')
              }
            })
          } else {
            debug('error compressing one of the log files ', err)
          }
        })
      })
    } else {
      debug('Error: could not find any logs to rotate')
    }
  })
}

workers.logRotationLoop = function() {
  setInterval(function() {
    workers.rotateLogs()
  }, 1000 * 60 * 60 * 24)
}

workers.init = function() {
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running')

  workers.gatherAllChecks()

  workers.loop()

  workers.rotateLogs()

  workers.logRotationLoop()
}
module.exports = workers

//???????????? ?????????? ?????????????? - ???????? ?????????????????? ?? ????????????
