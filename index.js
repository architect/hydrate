let series = require('run-series')

/**
 * populates or updates the deps for all lambdas. will always copy shared
 * resources into lambdas.
 *
 * @param {object} params
 * @param {boolean} params.install
 * @param {boolean} params.update
 */
module.exports = function hydrate(params={install:true}, callback) {
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
  let {verbose=false, basepath=''} = params
  let tasks = []
  if (params.install)
    tasks.push(function install(callback) {
      module.exports.install({verbose, basepath}, callback) // `install` includes `shared`
    })
  else if (params.update)
    tasks.push(function update(callback) {
      module.exports.update({verbose, basepath}, callback) // `update` includes `shared`
    })
  else
    tasks.push(module.exports.shared)

  series(tasks, function done(err) {
    if (err) callback(err)
    else callback()
  })
  return promise
}

module.exports.install = require('./src/install')
module.exports.shared = require('./src/shared')
module.exports.update = require('./src/update')
