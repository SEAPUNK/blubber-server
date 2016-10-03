'use strict'

const getBlob = require('./get-blob')
const putBlob = require('./put-blob')

module.exports = {
  get: getBlob,
  put: putBlob
}
