'use strict'

const path = require('path')
const http = require('http')

const copromise = require('mini-copromise')
const fastconf = require('fastconf')
const pify = require('pify')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const debug = require('debug')('blubber:init')
const debugHttp = require('debug')('blubber:http')
const Koa = require('koa')
const route = require('koa-route')
const rawBody = require('raw-body')
const guaranteedError = require('guaranteed-error')
const delay = require('delay')

const api = require('./api')

const startServer = copromise(function * startServer (env) {
  debug('env: %j', env)
  const config = fastconf({
    prefix: 'BLUBBER_',
    keys: [
      // Port to listen on
      ['PORT', {type: Number}],
      // (absolute path) Directory to store the blobs in
      'PATH',
      // Maximum blob size
      ['MAX_SIZE', {defaultValue: '10mb'}]
    ]
  }, null, env || process.env)

  debug('config: %j', config)

  debug('initializing dirs')

  const dirs = yield initDirs(config)

  const service = {
    config: config,
    api: api,
    dirs: dirs
  }

  debug('starting server')
  yield delay(1) // wait 1ms to guarantee prevention of name conficts
  service.http = yield setupHttp(service)
  debug('server started')

  return service
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

const setupHttp = copromise(function * setupHttp (service) {
  const server = new http.Server()
  const app = new Koa()

  const api = service.api
  const config = service.config

  const maxSize = config.maxSize

  app.use(copromise(function * (ctx, next) {
    const startTime = Date.now()
    debugHttp('-> %s %s', ctx.method, ctx.path)

    let statusCode = 200
    try {
      yield next()
    } catch (_err) {
      const err = guaranteedError(_err)
      debugHttp('!- %s %s \n%s', ctx.method, ctx.path, err.stack)
      if (err.code === 'ENOENT') {
        statusCode = 404
        ctx.body = err.friendlyMessage || 'not found'
      } else {
        statusCode = 500
        ctx.body = err.friendlyMessage || 'an error occured'
      }
    }

    ctx.status = statusCode

    const duration = Date.now() - startTime
    debugHttp('<- %s %s @ %s (%sms)', ctx.method, ctx.path, statusCode, duration)
  }))

  app.use(route.get('/get/:id', copromise(function * (ctx, id) {
    const data = yield api.get(service, id)
    ctx.length = data[0]
    ctx.body = data[1]
  })))

  app.use(route.post('/put', copromise(function * (ctx) {
    const body = yield rawBody(ctx.req, {
      length: ctx.req.headers['content-length'],
      limit: maxSize
    })

    ctx.body = yield api.put(service, body)
  })))

  app.use(copromise(function * (ctx) {
    const err = new Error('route not found')
    err.friendlyMessage = 'route not found'
    err.code = 'ENOENT'
    throw err
  }))

  yield pify(server.listen.bind(server))(config.port)

  server.on('request', app.callback())
  return app
})

module.exports = startServer
