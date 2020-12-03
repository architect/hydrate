let series = require('run-series')
let stripAnsi = require('strip-ansi')
let getPaths = require('./get-paths')
let copyShared = require('./copy-shared')
let copyViews = require('./copy-views')
let copyStaticJSON = require('./copy-static-json')
let copyArc = require('./copy-arc')
let { updater } = require('@architect/utils')
let _inventory = require('@architect/inventory')

module.exports = function shared (params = {}, callback) {
  let { quiet, update, inventory } = params

  let paths
  let start
  if (!update) {
    let updaterParams = { quiet }
    update = updater('Hydrate', updaterParams)
    params.update = update
  }
  series([
    function (callback) {
      if (!inventory) {
        _inventory({}, function (err, result) {
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
        start = update.status('Hydrating app with shared files')
      }
      paths = getPaths(inventory, 'shared')
      callback()
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
