var http = require('http')
var url = require('url')

var server = http.createServer(function(req, res) {
  var parsedUrl = url.parse(req.url, true)

  var path = parsedUrl.pathname
  var trimmedPath = path.replace(/^\/+|\/+$/g, '')

  var queryStringObject = parsedUrl.query

  var headers = req.headers

  var method = req.method.toLowerCase()

  res.end('Hello World!\n')

  console.log(
    'Request received  on path: ' +
      trimmedPath +
      'with method ' +
      method +
      ' query ',
    queryStringObject,
    'headers ',
    headers
  )
})

server.listen(3000, function() {
  console.log('The server is listening on port 3000 now')
})
