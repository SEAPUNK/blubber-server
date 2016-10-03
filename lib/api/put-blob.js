'use strict'

const fs = require('fs')
const path = require('path')

const copromise = require('mini-copromise')
const hasha = require('hasha')
const pify = require('pify')

let counter = 0

const writeFile = pify(fs.writeFile)
const rename = pify(fs.rename)

const putBlob = copromise(function * putBlob (service, blob) {
  if (!(blob instanceof Buffer)) {
    const err = new Error('Blob is not a buffer')
    err.friendlyMessage = 'invalid blob type'
    throw err
  }

  const hash = hasha(blob, {algorithm: 'sha1'})

  const name = hash + Date.now() + counter++

  const tempfile = path.join(service.dirs.get('temp'), name)
  const destfile = path.join(service.dirs.get('data'), name)

  yield writeFile(tempfile, blob)
  yield rename(tempfile, destfile)

  return name
})

module.exports = putBlob
