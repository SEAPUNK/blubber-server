'use strict'

const path = require('path')

const copromise = require('mini-copromise')
const fastconf = require('fastconf')
const pify = require('pify')
const mkdirp = require('mkdirp')

const api = require('./api')

const startServer = copromise(function * startServer (env) {
  console.log(env)

  const config = fastconf({
    prefix: 'BLUBBER_',
    keys: [
      // Port to listen on
      ['PORT', {type: Number}],
      // (absolute path) Directory to store the blobs in
      'PATH'
    ]
  }, null, env || process.env)

  const dirs = yield initDirs(config)

  const service = {
    config: config,
    api: api,
    dirs: dirs
  }
})

const initDirs = copromise(function * initDirs (config) {
  const basepath = config.path

  if (!path.isAbsolute(basepath)) throw new Error('Storage path must be absolute')

  yield pify(mkdirp)(basepath)

  const dirMap = new Map()

  dirMap.set('data', path.join(basepath, 'data'))
  yield pify(mkdirp)(dirMap.get('data'))

  dirMap.set('temp', path.join(basepath, 'temp'))
  yield pify(rimraf)(dirMap.get('temp'))
  yield pify(mkdirp)(dirMap.get('temp'))

  return dirMap
})

module.exports = startServer
