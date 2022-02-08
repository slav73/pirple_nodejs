var helpers = require('./../lib/helpers')
var assert = require('assert')
var logs = require('./../lib/logs')
var exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem')

var unit = {}

unit['helpers.getANumber should return a number'] = function(done) {
  var val = helpers.getANumber(typeof val, 'number')
  assert.equal(val, 1)
  done()
}

unit['helpers.getANumber should return 1'] = function(done) {
  var val = helpers.getANumber()
  assert.equal(val, 1)
  done()
}

unit['helpers.getANumber should return 2'] = function(done) {
  var val = helpers.getANumber()
  assert.equal(val, 2)
  done()
}

module.exports = unit
