var tls = require('tls')
var fs = require('fs')
var path = require('path')

var options = {
  ca: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
}

var outboundMessage = 'ping'

var client = tls.connect(6000, options, function() {
  client.write(outboundMessage)
})

client.on('data', function(inboundMessage) {
  var messageString = inboundMessage.toString()
  console.log('I wrote ' + outboundMessage + ' and you said ' + messageString)
  client.end()
})
