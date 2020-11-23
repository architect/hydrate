let glob = require('glob')
let series = require('run-series')
let { existsSync } = require('fs')
let { dirname, join, sep } = require('path')
let print = require('./_printer')
let child = require('child_process')
let shared = require('./shared')
let stripAnsi = require('strip-ansi')
let { updater } = require('@architect/utils')
let inventory = require('@architect/inventory')
let rm = require('rimraf')

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
    basepath,
    env,
    shell,
    timeout,
    quiet,
    verbose,
    // Isolation / sandbox
    copyShared = true,
    hydrateShared = true
  } = params

  let action = installing ? 'Hydrat' : 'Updat' // Used in logging below

  /**
   * Find our dependency manifests
   */
  // eslint-disable-next-line
  let pattern = p => `${p}/**/@(package\.json|requirements\.txt|Gemfile)`
  let dir = basepath || '.'
  // Get everything except shared
  let files = glob.sync(pattern(dir)).filter(function filter (filePath) {
    if (filePath.includes('node_modules') ||
        filePath.includes('vendor/bundle') ||
        filePath.includes('src/shared') ||
        filePath.includes('src/views'))
      return false
    return true
  })
  // Get src/shared + src/views
  //   or disable if we're hydrating a single function in total isolation (e.g. sandbox startup)
  if (hydrateShared) {
    let sharedFiles = glob.sync(pattern(process.cwd())).filter(function filter (filePath) {
      if (filePath.includes('node_modules') ||
          filePath.includes('vendor/bundle'))
        return false
      if (filePath.includes('src/shared') ||
          filePath.includes('src/views'))
        return true
    })
    files = files.concat(sharedFiles)
  }

  /**
   * Normalize paths
   */
  // Relativize by stripping leading relative path + `.`, `/`, `./`, `\`, `.\`
  let stripCwd = f => f.replace(process.cwd(), '').replace(/^\.?\/?\\?/, '')
  // Windows
  if (process.platform.startsWith('win')) {
    files = files.map(file => file.replace(/\//gi, '\\'))
  }
  // Ensure all paths are relative; previous glob ops may be from absolute paths, producing absolute-pathed results
  files = files.map(file => stripCwd(file))

  /**
   * Filter by active project paths (and root, if applicable)
   */
  files = files.filter(file => {
    // Allow root project hydration of process.cwd() if passed as basepath
    let hydrateBasepath = basepath === process.cwd()
    if (hydrateBasepath && dirname(file) === '.')
      return true

    // Allow src/shared and src/views
    let isShared = join('src', 'shared') // TODO add inventory-configured path
    let isViews = join('src', 'views') // TODO add inventory-configured path
    if (file.startsWith(isShared) || file.startsWith(isViews))
      return true

    // Hydrate functions, of course
    return inv.lambdaSrcDirs.some(p => stripCwd(p) === dirname(file))
  })

  /**
   * Build out job queue
   */
  let deps = files.length
  let updaterParams = { quiet }
  let update = updater('Hydrate', updaterParams)
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

  let ops = files.map(file => {
    let cwd = dirname(file)
    let options = { cwd, env, shell, timeout }
    return function hydration (callback) {
      let start
      let now = Date.now()

      // Prints and executes the command
      function exec (cmd, opts, callback) {
        let relativePath = cwd !== '.' ? cwd : 'project root'
        let done = `${action}ed ${relativePath}${sep}`
        start = update.start(`${action}ing ${relativePath}${sep}`)

        child.exec(cmd, opts,
          function (err, stdout, stderr) {
          // If zero output, acknowledge *something* happened
            if (!err && !stdout && !stderr) {
              update.cancel()
              stdout = `Done in ${(Date.now() - now) / 1000}s`
            }
            let params = { err, stdout, stderr, cmd, done, start, update, verbose }
            print(params, callback)
          })
      }

      let isJs = file.endsWith('package.json')
      let isPy = file.endsWith('requirements.txt')
      let isRb = file.endsWith('Gemfile')

      series([
        function clear (callback) {
          if (installing) {
            // Remove existing package dir first to prevent side effects from symlinking
            let dir
            if (isJs) dir = join(cwd, 'node_modules')
            if (isPy) dir = join(cwd, 'vendor')
            if (isRb) dir = join(cwd, 'vendor', 'bundle')
            rm(dir, callback)
          }
          else callback()
        },
        function install (callback) {
          // TODO: I think we should consider what minimum version of node/npm this
          // module needs to use as the npm commands below have different behaviour
          // depending on npm version - and enshrine those in the package.json
          let exists = file => existsSync(join(cwd, file))

          // Install JS deps
          if (isJs && installing) {
            if (exists('package-lock.json')) {
              exec(`npm ci`, options, callback)
            }
            else if (exists('yarn.lock')) {
              let local = join(cwd, 'node_modules', 'yarn')
              let cmd = local ? 'npx yarn' : 'yarn'
              exec(cmd, options, callback)
            }
            else {
              exec(`npm i`, options, callback)
            }
          }

          // Update JS deps
          else if (isJs && !installing) {
            if (exists('yarn.lock')) {
              let local = join(cwd, 'node_modules', 'yarn')
              let cmd = local ? 'npx yarn upgrade' : 'yarn upgrade'
              exec(cmd, options, callback)
            }
            else {
              exec(`npm update`, options, callback)
            }
          }

          // Install Python deps
          else if (isPy && installing) {
            exec(`pip3 install -r requirements.txt -t ./vendor`, options, callback)
          }

          // Update Python deps
          // TODO: pip requires manual locking (via two requirements.txt files) so we dont test update w/ python
          // ... thus, it may not make sense to execute this at all
          else if (isPy && !installing) {
            exec(`pip3 install -r requirements.txt -t ./vendor -U --upgrade-strategy eager`, options, callback)
          }

          // Install Ruby deps
          else if (isRb && installing) {
            exec(`bundle install --path vendor/bundle`, options, callback)
          }

          // Update Ruby deps
          else if (isRb && !installing) {
            exec(`bundle update`, options, callback)
          }

          else {
            callback()
          }
        }
      ], callback)
    }
  })

  // Usually run shared hydration
  if (copyShared) {
    ops.push(function (callback) {
      shared({ ...params, update, inventory }, callback)
    })
  }

  series(ops, function done (err, result) {
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
