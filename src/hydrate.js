let { globSync } = require('glob')
let series = require('run-series')
let { dirname, join, sep } = require('path')
let { readFileSync } = require('fs')
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
module.exports = function run (installing, params = {}, callback) {
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
  if (params.inventory) {
    hydrator(params.inventory, true, params, callback)
  }
  else {
    _inventory({ cwd: params.cwd }, function (err, inventory) {
      if (err) callback(err)
      else hydrator(inventory, installing, params, callback)
    })
  }
  return promise
}

function hydrator (inventory, installing, params, callback) {
  let { inv } = inventory
  let {
    // Main params
    autoinstall = true,
    installRoot = false,
    basepath,
    cwd,
    quiet,
    verbose,
    // Isolation / sandbox
    copyShared = true,
    hydrateShared = true,
  } = params
  let updaterParams = { quiet }
  let update = updater('Hydrate', updaterParams)
  let autoinstalled // Assigned later
  let action = installing ? 'Hydrat' : 'Updat' // Used in logging below

  // Does this project have any Lambdae?
  let hasLambdae = inv.lambdaSrcDirs?.length
  let hasASAP = inventory.inv.http?.find(l => l.arcStaticAssetProxy)
  let manifestFiles = [ 'package.json', 'requirements.txt', 'Gemfile' ]
  let possibleLambdaManifests = []
  if (hasLambdae) possibleLambdaManifests = inv.lambdaSrcDirs?.reduce((acc, dir) => {
    acc.push(...manifestFiles.map(manifest => stripCwd(join(dir, manifest), cwd)))
    return acc
  }, [])

  // From here on out normalize all file comparisons to Unix paths
  let sharedDir = inv.shared && inv.shared.src && stripCwd(inv.shared.src, cwd)
  let viewsDir = inv.views && inv.views.src && stripCwd(inv.views.src, cwd)

  /**
   * Find our dependency manifests
   */
  let pattern = p => pathToUnix(`${p}/**/@(${manifestFiles.join('|')})`)
  let dir = basepath || '.'
  // Get everything except shared
  let manifests = globSync(pattern(dir), { dot: true }).filter(file => {
    if (possibleLambdaManifests.includes(file)) return true
    if (isDep(file)) return false
    if (sharedDir && file.includes(sharedDir)) return false
    if (viewsDir && file.includes(viewsDir)) return false
    return true
  })
  // Get shared + views (or skip if hydrating a single isolated function, e.g. sandbox startup)
  if (hydrateShared) {
    let sharedManifest = (sharedDir && globSync(pattern(sharedDir)).filter(ignoreDeps)) || []
    let viewsManifest = (viewsDir && globSync(pattern(viewsDir)).filter(ignoreDeps)) || []
    manifests = manifests.concat(sharedManifest, viewsManifest)
  }

  /**
   * Relativize paths
   * Previous glob ops may be from absolute paths, producing absolute-pathed results
   */
  manifests = manifests.map(file => stripCwd(file, cwd))

  /**
   * Filter by active project paths (and root, if applicable)
   */
  manifests = manifests.filter(file => {
    let dir = dirname(file)

    // Allow root project hydration of cwd if passed as basepath
    let hydrateBasepath = basepath === cwd
    if (hydrateBasepath && dir === '.') return true
    if (installRoot) return true

    // Allow shared and views
    if (sharedDir && file.includes(sharedDir)) return true
    if (viewsDir && file.includes(viewsDir)) return true

    // Hydrate functions, of course
    return hasLambdae && inv.lambdaSrcDirs.some(p => stripCwd(p, cwd) === dir)
  })

  // Run the autoinstaller first in case we need to add any new manifests to the ops
  if (autoinstall && installing && (hasLambdae || hasASAP)) {
    let srcDirsWithoutManifests = []

    // Ignore directories already known to have a manifest
    if (hasLambdae) {
      srcDirsWithoutManifests = Object.entries(inv.lambdasBySrcDir).map(([ src, lambda ]) => {
        if (Array.isArray(lambda)) lambda = lambda[0] // Multi-tenant Lambda check
        let rel = stripCwd(src, cwd)
        let lambdaHasManifest = manifests.some(file => dirname(file) === rel)
        // TODO this should be enumerated in inventory
        if (lambdaHasManifest && lambda.config.runtime.startsWith('nodejs')) {
          try {
            let pkg = JSON.parse(readFileSync(join(src, 'package.json')))
            if (!pkg.dependencies && !pkg.peerDependencies && !pkg.devDependencies) return src
          }
          catch {
            update.error(`Invalid or unable to read ${src}${sep}package.json`)
          }
        }
        else if (!lambdaHasManifest) return src
      }).filter(Boolean)
    }

    // Handle special case: ASAP doesn't appear in lambdasBySrcDir since it's not userland
    if (hasASAP) {
      srcDirsWithoutManifests.push(hasASAP.src)
    }

    // Allow scoping to a single directory
    if (basepath) {
      srcDirsWithoutManifests = srcDirsWithoutManifests.filter(d => stripCwd(d, cwd) === stripCwd(basepath, cwd))
    }
    let result = actions.autoinstall({ dirs: srcDirsWithoutManifests, update, ...params, inventory })
    if (result.length) {
      autoinstalled = result
      let install = autoinstalled.map(({ dir, file }) => hasASAP?.src === dir
        // At this point, ASAP has been given a package.json, and should just be run as an absolute path
        ? join(dir, file)
        : stripCwd(join(dir, file), cwd))
      manifests = manifests.concat(install)
    }
  }

  /**
   * Build out job queue
   */
  let ops = []
  let deps = manifests.length
  if (deps && deps > 0) {
    let msg = `${action}ing dependencies in ${deps} path${deps > 1 ? 's' : ''}`
    update.status(msg)
  }
  if (!deps && verbose) {
    update.status(`No Lambda dependencies found`)
  }

  // Install + update
  manifests.sort().forEach(file => {
    ops.push(callback => actions.hydrate({
      action,
      file,
      installing,
      update,
      inventory,
      ...params,
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
