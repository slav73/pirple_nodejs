var server = require('./lib/server')
var workers = require('./lib/workers')
var cli = require('./lib/cli')
var os = require('os')
var cluster = require('cluster')

var app = {}

app.init = function(callback) {
  if (cluster.isMaster) {
    workers.init()

    setTimeout(function() {
      cli.init()
      callback()
    }, 50)

    for (var i = 0; i < os.cpus().length; i++) {
      cluster.fork()
    }
  } else {
    server.init()
  }
}

if (require.main === module) {
  app.init(function() {})
}

module.exports = app
