#!/usr/bin/env node
let minimist = require('minimist')
let hydrate = require('.')

/**
 * `arc hydrate`
 *
 * Hydrates functions' dependencies, respecting runtime
 *
 * options
 * (default) ...... hydrates all functions, shared, copies files
 * -s|--shared .... hydrates and copies shared files only
 * -u|--update .... updates each function's dependencies
 * -v|--verbose ... prints additional output to console
 */
async function main (options = {}) {
  let { inventory } = options

  let alias = {
    update:   [ 'u', 'upgrade' ],
    shared:   [ 's' ],
    debug:    [ 'd' ],
    verbose:  [ 'v' ],
  }
  let boolean = [ 'autoinstall', 'update', 'production', 'verbose' ]
  let def = { autoinstall: true }
  let args = minimist(process.argv.slice(2), { alias, boolean, default: def })
  if (args._[0] === 'hydrate') args._.splice(0, 1)

  let params = {
    inventory,
    autoinstall:  args.autoinstall,
    verbose:      args.verbose,
  }

  if (args.shared) {
    hydrate.shared(params)
  }
  else if (args.update) {
    hydrate.update(params)
  }
  else {
    hydrate.install(params)
  }
}

module.exports = main

// allow direct invoke
if (require.main === module) {
  (async function () {
    try {
      await main()
    }
    catch (err) {
      console.log(err)
    }
  })()
}
