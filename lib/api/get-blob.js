'use strict'

const path = require('path')
const fs = require('fs')
const debug = require('debug')('blubber:get')

const pify = require('pify')
const copromise = require('mini-copromise')

const getBlob = copromise(function * getBlob (service, name) {
  if (!/^[a-zA-Z0-9]{1,100}$/.test(name)) {
    const err = new Error('invalid name')
    err.friendlyMessage = 'invalid name'
    throw err
  }

  const location = path.join(service.dirs.get('data'), name)
  let stat
  try {
    stat = yield pify(fs.stat)(location)
  } catch (err) {
    err.friendlyMessage = 'blob not found'
    throw err
  }

  if (!stat.isFile()) throw new Error('Not a file (!!!)')

  debug('%s %s', stat.size, name)

  return [stat.size, fs.createReadStream(location)]
})

module.exports = getBlob
