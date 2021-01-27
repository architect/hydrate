let run = require('./src')
let shared = require('./src/shared')

/**
 * populates or updates the deps for all lambdas. will always copy shared
 * resources into lambdas.
 *
 * @param {object} params
 * @param {boolean} params.install - install dependencies
 * @param {boolean} params.update - update dependencies; if also found with install, install takes priority
 * @param {boolean} params.symlink - use shared code symlinks
 */
function hydrate (params = { install: true }, callback) {
  // if a callback isn't supplied return a promise
  let promise
  if (!callback) {
    promise = new Promise(function ugh (res, rej) {
      callback = function errback (err, result) {
        if (err) rej(err)
        else res(result)
      }
    })
  }
  let { autoinstall, verbose = false, basepath = '', symlink = false } = params
  if (params.install) {
    run.install({ autoinstall, verbose, basepath, symlink }, callback) // `install` includes `shared`
  }
  else if (params.update) {
    run.update({ verbose, basepath, symlink }, callback) // `update` includes `shared`
  }
  else {
    shared({ symlink }, callback)
  }

  return promise
}

hydrate.install = run.install
hydrate.update = run.update
hydrate.shared = shared

module.exports = hydrate
