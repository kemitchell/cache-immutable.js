```javascript
var assert = require('assert')
var http = require('http')

var cacheImmutable = require('cache-immutable')

var receivedResponse = false

http.createServer()
.on('request', function (request, response) {
  // Call the function with a Node.js http.ServerResponse argument.
  cacheImmutable(response)
  response.end()
})
.listen(0 /* random high port */, function () {
  var server = this
  var port = server.address().port
  http.request({port: port})
  .on('response', function (response) {
    var headers = response.headers
    // RFC 2616 (HTTP 1.1), section 14.21
    assert.equal(headers['cache-control'], 'max-age=31536000')
    // 31536000
    // = 365 * 24 * 60 * 60
    // ~= a (non-leap) year's worth of seconds
    // HTTP 1.0 headers.  See note below.
    assert.equal('expires' in headers, false)
    assert.equal('pragma' in headers, false)
    receivedResponse = true
    server.close()
  })
  .end()
})

process.on('exit', function () {
  assert.equal(receivedResponse, true)
  console.log('Tests passed')
})
```

HTTP 1.0 defines the Expires header, and HTTP 1.1 (RFC 2616 section
14.21) mentions:

> To mark a response as "never expires," an origin server sends an
> Expires date approximately one year from the time the response is
> sent. HTTP/1.1 servers SHOULD NOT send Expires dates more than one
> year in the future.

Cache-Control is much simpler; there are all kinds of
quirks to deal with generating and parsing the "HTTP-date" format for
Expires, while max-age is just a number of seconds.

Fortunately, section 14.9.3 clarifies:

> Furthermore If a response includes both an Expires header and a
> max-age directive, the max-age directive overrides the Expires header,
> even if the Expires header is more restrictive. This rule allows an
> origin server to provide, for a given response, a longer expiration
> time to an HTTP/1.1 (or later) cache than to an HTTP/1.0 cache.

Fortunately, many "HTTP 1.0" clients actually support Cache-Control,
like nearly all recent clients. Mark Nottingham [notes][Nottingham]
that's actually legit under RFC 2145. Section 2.2 says:

[Nottingham]: https://www.mnot.net/blog/2007/05/15/expires_max-age

> For example, an HTTP/1.1 server may send a "Cache-control" header to
> an HTTP/1.0 client; this may be useful if the immediate recipient is
> an HTTP/1.0 proxy, but the ultimate recipient is an HTTP/1.1 client.
