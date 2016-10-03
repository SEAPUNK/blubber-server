'use strict'

const copromise = require('mini-copromise')

const putBlob = copromise(function * putBlob (service, blob) {
  if (!(blob instanceof Buffer)) {
    throw new Error('Blob is not a buffer')
  }

  // TODO: Save the blob
  throw new Error('not imeplemented')
})

module.exports = putBlob
