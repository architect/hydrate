let cp = require('./copy')
let { join } = require('path')
let series = require('run-series')
let print = require('../_printer')

/**
 * copies src/shared
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs*  | node_modules/@architect/shared/
 * else     | vendor/shared/
 */
module.exports = function copyShared (params, paths, callback) {
  let { update, only, inventory } = params
  let { inv } = inventory
  let hasShared = inv.shared && inv.shared.shared.length
  let go = !only || only === 'shared'

  if (hasShared && go) {
    let { src, shared } = inv.shared
    // Kick off logging
    let done = `Hydrated app with ${src}`
    let start = update.start(`Hydrating app with ${src}`)

    series(shared.map(share => {
      return function copier (callback) {
        if (paths[share]) {
          let finalDest = join(paths[share], 'shared')
          cp(src, finalDest, params, callback)
        }
        else callback()
      }
    }), function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    })
  }
  else callback()
}
