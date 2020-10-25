let cp = require('./copy')
let { existsSync } = require('fs')
let { join, sep } = require('path')
let series = require('run-series')
let print = require('../_printer')

/**
 * copies src/views
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs*  | node_modules/@architect/views/
 * else     | vendor/views/
 */
module.exports = function copyViews (params, paths, callback) {
  let { update, only, inventory } = params
  let { inv, get } = inventory
  let views = join(process.cwd(), 'src', 'views')
  let hasViews = existsSync(views)
  let go = !only || only === 'views'

  if (hasViews && inv.http && go) {
    // Kick off logging
    let srcViews = `src${sep}views`
    let done = `Hydrated app with ${srcViews}`
    let start = update.start(`Hydrating app with ${srcViews}`)

    // First look for items listed in @views
    let viewsPaths = inv.views && inv.views.map(view => get.http(view) && get.http(view).src)
    // If nothing, look for `get` + `any` routes
    if (!viewsPaths.length) viewsPaths = inv.http.map(route => {
      let { arcStaticAssetProxy, name } = route
      return !arcStaticAssetProxy && (name.startsWith('get') || name.startsWith('any'))
    })
    let isView = (dest) => viewsPaths.some(p => dest.startsWith(p))

    function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    }
    series(paths.map(dest => {
      return function copier (callback) {
        if (isView(dest)) {
          let finalDest = join(dest, 'views')
          cp(views, finalDest, params, callback)
        }
        else {
          callback()
        }
      }
    }), _done)
  }
  else callback()
}
