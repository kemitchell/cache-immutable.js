module.exports = function cacheImmutable(response) {
  response.setHeader('Cache-Control', 'max-age=31536000') }
