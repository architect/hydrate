let cp = require('./copy')
let { existsSync } = require('fs')
let { join } = require('path')
let series = require('run-series')
let print = require('../_printer')

/**
 * copies public/static.json
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs*  | node_modules/@architect/shared/static.json
 * else     | vendor/shared/static.json
 */
module.exports = function copyStatic (params, paths, callback) {
  let { cwd, inventory, update, only } = params
  let { get } = inventory
  let go = !only || only === 'staticJson' || only === 'shared'

  let staticDir = get.static('folder')
  let staticJson = staticDir && join(cwd, staticDir, 'static.json')
  let hasStatic = staticDir && existsSync(staticJson)
  if (hasStatic && go) {
    // Kick off logging
    let done = `Hydrated app with static.json`
    let start = update.start(`Hydrating app with static.json`)

    let destinations = Object.entries(paths.all).map(p => p[1])
    series(destinations.map(dest => {
      return function copier (callback) {
        cp(staticJson, join(dest, 'shared', 'static.json'), params, callback)
      }
    }), function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, done, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    })
  }
  else callback()
}
