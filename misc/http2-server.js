var http2 = require('http2')

var server = http2.createServer()

server.on('stream', function(stream, headers) {
  stream.respond({
    status: 200,
    'content-type': 'text/html',
  })
  stream.end('<html><body><p>Hello World</p></body></html>')
})

server.listen(6000, () => console.log('Listening on port 6000'))
