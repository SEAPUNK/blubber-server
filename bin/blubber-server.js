#!/usr/bin/env node
'use strict'

const meow = require('meow')
const path = require('path')
const guaranteedError = require('guaranteed-error')

const cli = meow(`
    Usage
      $ blubber-server

    Options
      --port, -p      Port to listen on (env: BLUBBER_PORT)
      --quiet, -q     Don't log to console
      --dir, -d       Absolute path to use for storage, defaults to $PWD/blubber-data (env: BLUBBER_PATH)
      --max-size, -m  Maximum blob size allowed, default 10mb (env: BLUBBER_MAX_SIZE)

    Examples
      $ blubber-server -p 22233 -m 100mb
`, {
  alias: {
    q: 'quiet',
    p: 'port',
    d: 'dir',
    m: 'max-size'
  }
})

if (!cli.flags.quiet) {
  process.env.DEBUG = 'blubber:*'
}

if (!cli.flags.port || typeof cli.flags.port !== 'number') {
  throw new Error('Invalid or no port provided.')
}
if (cli.flags.path && typeof cli.flags.path !== 'string') {
  throw new Error('Invalid path provided.')
}
if (cli.flags['max-size'] && typeof cli.flags['max-size'] !== 'string') {
  throw new Error('Invalid max size provided.')
}

require('../')({
  BLUBBER_PORT: String(cli.flags.port) || process.env.BLUBBER_PORT,
  BLUBBER_PATH: cli.flags.path || process.env.BLUBBER_PATH || path.join(process.cwd(), 'blubber-data'),
  BLUBBER_MAX_SIZE: cli.flags['max-size'] || process.env.BLUBBER_MAX_SIZE
}).catch(err => {
  console.error(guaranteedError(err).stack)
  process.stdout.write('', () => {
    process.exit(1)
  })
})
