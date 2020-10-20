let cp = require('./copy')
let { existsSync } = require('fs')
let { join, sep } = require('path')
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
  let { update, only } = params
  let shared = join(process.cwd(), 'src', 'shared')
  let hasShared = existsSync(shared)
  let go = !only || only === 'shared'

  if (hasShared && go) {
    // Kick off logging
    let srcShared = `src${sep}shared`
    let done = `Hydrated app with ${srcShared}`
    let start = update.start(`Hydrating app with ${srcShared}`)

    function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    }
    series(paths.map(dest => {
      return function copier (callback) {
        let finalDest = join(dest, 'shared')
        cp(shared, finalDest, params, callback)
      }
    }), _done)
  }
  else callback()
}
