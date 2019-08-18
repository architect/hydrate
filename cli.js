#!/usr/bin/env node
let hydrate = require('.')

/**
 * `arc hydrate`
 *
 * Hydrates functions' dependencies, respecting runtime
 *
 * options
 * -s|--shared|shared ..... hydrates and copies shared files only
 * -u|--update|update ..... updates each function's dependencies
 * -v|--verbose|verbose ... prints additional output to console
 */
let isShared = opt => opt === 'shared' || opt === '--shared' || opt === '-s'
let isUpdate = opt => opt === 'update' || opt === '--update' || opt === '-u'
let isVerbose = opt => opt === 'verbose' || opt === '--verbose' || opt === '-v'

async function cmd(opts=[]) {

  let args = {
    verbose: opts.some(isVerbose)
  }

  if (opts.some(isShared)) {
    return hydrate(args)
  }

  if (opts.some(isUpdate)) {
    args.update = true
    return hydrate(args)
  }

  args.install = true
  return hydrate(args)
}

module.exports = cmd

// allow direct invoke
if (require.main === module) {
  (async function() {
    try {
      await cmd(process.argv)
    }
    catch (err) {
      console.log(err)
    }
  })();
}
