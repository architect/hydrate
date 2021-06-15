let { install, update } = require('./src')
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
function hydrate (params, callback) {
  params = params || { install: true }
  params.cwd = params.cwd || process.cwd()

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
  let { autoinstall, basepath = '', cwd, symlink = false, verbose = false } = params
  if (params.install) {
    install({ autoinstall, basepath, cwd, symlink, verbose }, callback) // `install` includes `shared`
  }
  else if (params.update) {
    update({ basepath, cwd, symlink, verbose }, callback) // `update` includes `shared`
  }
  else {
    shared({ symlink }, callback)
  }

  return promise
}

hydrate.install = install
hydrate.update = update
hydrate.shared = shared

module.exports = hydrate
