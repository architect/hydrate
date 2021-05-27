let { sync: glob } = require('glob')
let series = require('run-series')
let { dirname, join } = require('path')
let { existsSync: exists } = require('fs')
let stripAnsi = require('strip-ansi')
let { pathToUnix, updater } = require('@architect/utils')
let inventory = require('@architect/inventory')
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
module.exports = {
  install: function (params = {}, callback) {
    inventory({}, function (err, result) {
      if (err) callback(err)
      else hydrator(result, true, params, callback)
    })
  },
  update: function (params = {}, callback) {
    inventory({}, function (err, result) {
      if (err) callback(err)
      else hydrator(result, false, params, callback)
    })
  },
}

function hydrator (inventory, installing, params, callback) {
  let { inv } = inventory
  let {
    // Main params
    autoinstall = false,
    installRoot = false,
    basepath,
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
  let sharedDir = inv.shared && inv.shared.src && pathToUnix(stripCwd(inv.shared.src))
  let viewsDir = inv.views && inv.views.src && pathToUnix(stripCwd(inv.views.src))

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

  // Add deno cacheable files if they exist and we're hyrdrating a Deno runtime
  let lambda = inv.lambdasBySrcDir[basepath]
  if (lambda !== undefined && lambda.config !== undefined) {
    let isDeno = lambda.config.runtime === 'deno'
    if (isDeno) {
      let denoCacheableFiles = [
        'index.js',
        'mod.js',
        'index.ts',
        'mod.ts',
        'index.tsx',
        'mod.tsx',
        'deps.ts'
      ]
      denoCacheableFiles.map(denoFile => {
        let file = join(basepath, denoFile)
        if (exists(file)) {
          files.push(file)
        }
      })
    }
  }

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
  files = files.map(file => stripCwd(file))

  /**
   * Filter by active project paths (and root, if applicable)
   */
  files = files.filter(file => {
    let dir = pathToUnix(dirname(file))

    // Allow root project hydration of process.cwd() if passed as basepath
    let hydrateBasepath = basepath === process.cwd()
    if (hydrateBasepath && dir === '.') return true
    if (installRoot) return true

    // Allow shared and views
    if (sharedDir && file.includes(sharedDir)) return true
    if (viewsDir && file.includes(viewsDir)) return true

    // Hydrate functions, of course
    return hasLambdae && inv.lambdaSrcDirs.some(p => pathToUnix(stripCwd(p)) === dir)
  })

  // Run the autoinstaller first in case we need to add any new manifests to the ops
  if (autoinstall && installing && hasLambdae) {
    // Ignore directories already known to have a manifest
    let dirs = inv.lambdaSrcDirs.filter(d => !files.some(file => dirname(file) === pathToUnix(stripCwd(d))))
    // Allow scoping to a single directory
    if (basepath) dirs = dirs.filter(d => pathToUnix(stripCwd(d)) === pathToUnix(stripCwd(basepath)))
    let result = actions.autoinstall({ dirs, update, inventory, ...params })
    if (result.length) {
      autoinstalled = result
      let install = autoinstalled.map(({ dir, file }) => stripCwd(join(dir, file)))
      files = files.concat(install)
    }
  }

  /**
   * Build out job queue
   */
  let deps = files.length
  let init = ''
  if (deps && deps > 0) {
    let msg = `${action}ing dependencies in ${deps} path${deps > 1 ? 's' : ''}`
    init += update.status(msg)
  }
  if (!deps && verbose) {
    init += update.status(`No Lambda dependencies found`)
  }
  if (init) {
    init = {
      raw: { stdout: stripAnsi(init) },
      term: { stdout: init }
    }
  }
  // The job queue
  let ops = []

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

  series(ops, function done (err, result) {
    // Tidy up before exiting
    cleanup(autoinstalled)

    result = [].concat.apply([], result) // Flatten the nested shared array
    if (init) result.unshift(init) // Bump init logging to the top
    if (err) callback(err, result)
    else {
      if (deps && deps > 0) {
        let done = update.done(`Successfully ${action.toLowerCase()}ed dependencies`)
        result.push({
          raw: { stdout: stripAnsi(done) },
          term: { stdout: done }
        })
      }
      if (!deps && !quiet) {
        let done = update.done(`Finished checks, nothing to ${action.toLowerCase()}e`)
        result.push({
          raw: { stdout: stripAnsi(done) },
          term: { stdout: done }
        })
      }
      callback(null, result)
    }
  })
}
