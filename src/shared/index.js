let { existsSync } = require('fs')
let { join } = require('path')
let series = require('run-series')
let stripAnsi = require('strip-ansi')
let getPaths = require('./get-paths')
let copyShared = require('./copy-shared')
let copyViews = require('./copy-views')
let copyStaticJSON = require('./copy-static-json')
let copyArc = require('./copy-arc')
let { updater } = require('@architect/utils')
let inv = require('@architect/inventory')

module.exports = function shared (params = {}, callback) {
  let { quiet, update, inventory } = params
  let shared = join(process.cwd(), 'src', 'shared')
  let views = join(process.cwd(), 'src', 'views')
  let hasShared = existsSync(shared) || existsSync(views)

  let start
  if (!update) {
    let updaterParams = { quiet }
    update = updater('Hydrate', updaterParams)
    params.update = update
  }
  if (hasShared)
    start = update.status('Hydrating app with shared files')

  series([
    function (callback) {
      if (!inventory) {
        inv({}, function (err, result) {
          if (err) callback(err)
          else {
            inventory = params.inventory = result
            callback()
          }
        })
      }
      else callback()
    },
    function (callback) {
      let paths = getPaths(inventory, 'shared')
      copyShared(params, paths, callback)
    },
    function (callback) {
      let paths = getPaths(inventory, 'views')
      copyViews(params, paths, callback)
    },
    function (callback) {
      let paths = getPaths(inventory)
      copyStaticJSON(params, paths, callback)
    },
    function (callback) {
      let paths = getPaths(inventory)
      copyArc(params, paths, callback)
    },
  ], function done (err, result) {
    if (err) callback(err)
    else {
      // Remove empty positions from series functions that skipped
      result = result.filter(r => r)
      if (start) {
        result.unshift({
          raw: stripAnsi(start),
          term: {
            stdout: start
          }
        })
      }
      callback(null, result)
    }
  })
}
