let cp = require('./copy')
let { existsSync } = require('fs')
let { join } = require('path')
let series = require('run-series')
let print = require('../_printer')
let { readArc } = require('@architect/utils')

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
  let { update, only } = params
  let go = !only || only === 'staticJson' || only === 'shared'

  let { arc } = readArc()
  let staticDir = 'public'
  if (arc.static && arc.static.some(i => i[0] === 'folder')) {
    staticDir = arc.static[arc.static.findIndex(i => i[0] === 'folder')][1] || 'public'
  }
  let static = join(process.cwd(), staticDir, 'static.json')
  let hasStatic = existsSync(static)

  if (hasStatic && go) {
    // Kick off logging
    let done = `Hydrated app with static.json`
    let start = update.start(`Hydrating app with static.json`)

    function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    }
    series(paths.map(dest => {
      return function copier (callback) {
        cp(static, join(dest, 'shared', 'static.json'), params, callback)
      }
    }), _done)
  }
  else callback()
}
