var net = require('net')

var server = net.createServer(function(connection) {
  var outboundMessage = 'pong'
  connection.write(outboundMessage)

  connection.on('data', function(inboundMessage) {
    var messageString = inboundMessage.toString()
    console.log('I wrote ' + outboundMessage + ' and you said ' + messageString)
  })
})

server.listen(6000)
