let { sync: glob } = require('glob')
let series = require('run-series')
let { dirname, join } = require('path')
let { pathToUnix, updater } = require('@architect/utils')
let _inventory = require('@architect/inventory')
let { isDep, ignoreDeps, stripCwd } = require('./lib')
let shared = require('./shared')
let actions = require('./actions')
let cleanup = require('./_cleanup')

/**
 * Installs deps into or updates current deps in:
 * - functions
 * - shared
 * - views
 */
function run (installing, params = {}, callback) {
  params.cwd = params.cwd || process.cwd()
  params.basepath = params.basepath || ''

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
  if (params.inventory) hydrator(params.inventory, true, params, callback)
  else {
    _inventory({ cwd: params.cwd }, function (err, inventory) {
      if (err) callback(err)
      else hydrator(inventory, installing, params, callback)
    })
  }
  return promise
}
module.exports = {
  install: run.bind({}, true),
  update: run.bind({}, false),
}

function hydrator (inventory, installing, params, callback) {
  let { inv } = inventory
  let {
    // Main params
    autoinstall = false,
    installRoot = false,
    basepath,
    cwd,
    quiet,
    verbose,
    // Isolation / sandbox
    copyShared = true,
    hydrateShared = true
  } = params
  let updaterParams = { quiet }
  let update = updater('Hydrate', updaterParams)
  let autoinstalled // Assigned later
  let action = installing ? 'Hydrat' : 'Updat' // Used in logging below

  // Does this project have any Lambdae?
  let hasLambdae = inv.lambdaSrcDirs && inv.lambdaSrcDirs.length

  // From here on out normalize all file comparisons to Unix paths
  let sharedDir = inv.shared && inv.shared.src && pathToUnix(stripCwd(inv.shared.src, cwd))
  let viewsDir = inv.views && inv.views.src && pathToUnix(stripCwd(inv.views.src, cwd))

  /**
   * Find our dependency manifests
   */
  // eslint-disable-next-line
  let pattern = p => `${p}/**/@(package\.json|requirements\.txt|Gemfile)`
  let dir = basepath || '.'
  // Get everything except shared
  let files = glob(pattern(dir)).filter(file => {
    file = pathToUnix(file)
    if (isDep(file)) return false
    if (sharedDir && file.includes(sharedDir)) return false
    if (viewsDir && file.includes(viewsDir)) return false
    return true
  })
  // Get shared + views (or skip if hydrating a single isolated function, e.g. sandbox startup)
  if (hydrateShared) {
    let sharedManifest = (sharedDir && glob(pattern(sharedDir)).filter(ignoreDeps)) || []
    let viewsManifest = (viewsDir && glob(pattern(viewsDir)).filter(ignoreDeps)) || []
    files = files.concat(sharedManifest, viewsManifest)
  }

  /**
   * Relativize paths
   * Previous glob ops may be from absolute paths, producing absolute-pathed results
   */
  files = files.map(file => stripCwd(file, cwd))

  /**
   * Filter by active project paths (and root, if applicable)
   */
  files = files.filter(file => {
    let dir = pathToUnix(dirname(file))

    // Allow root project hydration of cwd if passed as basepath
    let hydrateBasepath = basepath === cwd
    if (hydrateBasepath && dir === '.') return true
    if (installRoot) return true

    // Allow shared and views
    if (sharedDir && file.includes(sharedDir)) return true
    if (viewsDir && file.includes(viewsDir)) return true

    // Hydrate functions, of course
    return hasLambdae && inv.lambdaSrcDirs.some(p => pathToUnix(stripCwd(p, cwd)) === dir)
  })

  // Run the autoinstaller first in case we need to add any new manifests to the ops
  if (autoinstall && installing && hasLambdae) {
    // Ignore directories already known to have a manifest
    let dirs = inv.lambdaSrcDirs.filter(d => !files.some(file => dirname(file) === pathToUnix(stripCwd(d, cwd))))
    // Allow scoping to a single directory
    if (basepath) dirs = dirs.filter(d => pathToUnix(stripCwd(d, cwd)) === pathToUnix(stripCwd(basepath, cwd)))
    let result = actions.autoinstall({ dirs, update, inventory, ...params })
    if (result.length) {
      autoinstalled = result
      let install = autoinstalled.map(({ dir, file }) => stripCwd(join(dir, file), cwd))
      files = files.concat(install)
    }
  }

  /**
   * Build out job queue
   */
  let ops = []
  let deps = files.length
  if (deps && deps > 0) {
    let msg = `${action}ing dependencies in ${deps} path${deps > 1 ? 's' : ''}`
    update.status(msg)
  }
  if (!deps && verbose) {
    update.status(`No Lambda dependencies found`)
  }

  // Install + update
  files.sort().forEach(file => {
    ops.push(callback => actions.hydrate({
      action,
      file,
      installing,
      update,
      ...params
    }, callback))
  })

  // Usually run shared hydration
  if (copyShared) {
    ops.push(callback => shared({ update, inventory, ...params }, callback))
  }

  series(ops, function done (err) {
    // Tidy up before exiting
    cleanup(autoinstalled)
    if (err) callback(err)
    else {
      if (deps && deps > 0) {
        update.done(`Successfully ${action.toLowerCase()}ed dependencies`)
      }
      if (!deps && !quiet) {
        update.done(`Finished checks, nothing to ${action.toLowerCase()}e`)
      }
      callback()
    }
  })
}
