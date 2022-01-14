let cp = require('./copy')
let { join } = require('path')
let series = require('run-series')
let print = require('../_printer')
let { stripCwd } = require('../lib')

/**
 * copies views
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs*  | node_modules/@architect/views/
 * else     | vendor/views/
 */
module.exports = function copyViews (params, paths, callback) {
  let { cwd, update, only, inventory } = params
  let { inv } = inventory
  let hasViews = inv.views?.views?.length
  let go = !only || only === 'views'

  if (hasViews && go) {
    let { src, views } = inv.views
    // Kick off logging
    let done = `Hydrated app with views: ${stripCwd(src, cwd)}`
    let start = update.start(`Hydrating app with views: ${stripCwd(src, cwd)}`)

    series(views.map(view => {
      return function copier (callback) {
        if (paths.views[view]) {
          let finalDest = join(paths.views[view], 'views')
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
