let series = require('run-series')
let getPaths = require('./get-paths')
let resetShared = require('./reset')
let copyShared = require('./copy-shared')
let copyViews = require('./copy-views')
let copyStaticJSON = require('./copy-static-json')
let copyPlugins = require('./copy-plugins')
let { updater } = require('@architect/utils')
let _inventory = require('@architect/inventory')

module.exports = function shared (params = {}, callback) {
  let { inventory, quiet, update } = params
  params.cwd = params.cwd || process.cwd()

  // If a callback isn't supplied return a promise
  let promise
  if (!callback) {
    promise = new Promise(function ugh (res, rej) {
      callback = function errback (err, result) {
        if (err) rej(err)
        else res(result)
      }
    })
  }

  let paths
  if (!update) {
    let updaterParams = { quiet }
    update = updater('Hydrate', updaterParams)
    params.update = update
  }
  series([
    function (callback) {
      if (!inventory) {
        _inventory({ cwd: params.cwd }, function (err, result) {
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
      let { inv } = inventory
      let { shared, views } = inv
      if (shared || views) {
        update.status('Hydrating app with shared files')
      }
      paths = getPaths(inventory)
      callback()
    },
    function (callback) {
      resetShared(paths, callback)
    },
    function (callback) {
      copyShared(params, paths, callback)
    },
    function (callback) {
      copyViews(params, paths, callback)
    },
    function (callback) {
      copyStaticJSON(params, paths, callback)
    },
    function (callback) {
      copyPlugins(params, paths, callback)
    },
  ], function done (err) {
    if (err) callback(err)
    else callback()
  })

  return promise
}
