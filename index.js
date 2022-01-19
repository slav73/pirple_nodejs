var http = require('http')
var url = require('url')
var StringDecoder = require('string_decoder').StringDecoder

var server = http.createServer(function(req, res) {
  var parsedUrl = url.parse(req.url, true)

  var path = parsedUrl.pathname
  var trimmedPath = path.replace(/^\/+|\/+$/g, '')

  var queryStringObject = parsedUrl.query

  var headers = req.headers

  var method = req.method.toLowerCase()

  var decoder = new StringDecoder('utf-8')
  var buffer = ''
  req.on('data', function(data) {
    buffer += decoder.write(data)
  })

  req.on('end', function() {
    buffer += decoder.end()
    res.end('Hello World!\n')

    console.log('Request received with this payload: ', buffer)
  })
})

server.listen(3000, function() {
  console.log('The server is listening on port 3000 now')
})
