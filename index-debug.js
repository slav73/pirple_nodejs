var server = require('./lib/server')
var workers = require('./lib/workers')
var cli = require('./lib/cli')
var example = require('./lib/exampleDebuggingProblem')

var app = {}

app.init = function() {
  server.init()

  workers.init()

  setTimeout(function() {
    cli.init()
  }, 50)

  var foo = 1
  foo++
  foo = foo * foo
  foo = foo.toString()

  example.init()
}

app.init()

module.exports = app
