var net = require('net')

var outboundMessage = 'ping'

var client = net.createConnection({ port: 6000 }, function() {
  client.write(outboundMessage)
})

client.on('data', function(inboundMessage) {
  var messageString = inboundMessage.toString()
  console.log('I wrote ' + outboundMessage + ' and you said ' + messageString)
  client.end()
})
