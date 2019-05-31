let series = require('run-series')
let installDeps = require('./src/install-deps')
let copyArc = require('./src/copy-arc')
let copyShared = require('./src/copy-shared')
let copyViews = require('./src/copy-views')
let copyStaticJSON = require('./src/copy-static-json')

/**
 * populates the deps for all lambdas
 *
 * @param {object} params
 * @param {boolean} params.install
 */
module.exports = function hydrate(params={}, callback) {
  // if a callback isn't supplied return a promise
  let promise
  if (!callback) {
    promise = new Promise(function ugh(res, rej) {
      callback = function errback(err, result) {
        if (err) rej(err)
        else res(result)
      }
    })
  }
  // always do these tasks
  let tasks = [
    copyShared,
    copyViews,
    copyStaticJSON,
    copyArc,
  ]
  // maybe do these
  if (params.install)
    tasks.unshift(installDeps)
  // order important!
  series(tasks, function done(err) {
    if (err) callback(err)
    else callback()
  })
  return promise
}
