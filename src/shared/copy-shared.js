let cp = require('./copy')
let { join } = require('path')
let series = require('run-series')
let print = require('../_printer')
let { stripCwd } = require('../lib')

/**
 * copies shared
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs*  | node_modules/@architect/shared/
 * else     | vendor/shared/
 */
module.exports = function copyShared (params, paths, callback) {
  let { cwd, update, only, inventory } = params
  let { inv } = inventory
  let hasShared = inv.shared?.shared?.length
  let go = !only || only === 'shared'

  if (hasShared && go) {
    let { src, shared } = inv.shared
    // Kick off logging
    let done = `Hydrated app with shared: ${stripCwd(src, cwd)}`
    let start = update.start(`Hydrating app with shared: ${stripCwd(src, cwd)}`)

    series(shared.map(share => {
      return function copier (callback) {
        if (paths.shared[share]) {
          let finalDest = join(paths.shared[share], 'shared')
          cp(src, finalDest, params, callback)
        }
        else callback()
      }
    }), function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, done, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    })
  }
  else callback()
}
