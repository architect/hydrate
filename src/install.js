let glob = require('glob')
let series = require('run-series')
let fs = require('fs')
let path = require('path')
let print = require('./_printer')
let child = require('child_process')
let shared = require('./shared')
let stripAnsi = require('strip-ansi')
let {inventory, updater} = require('@architect/utils')

/**
 * Installs deps into:
 * - functions
 * - src/shared
 * - src/views
 */
module.exports = function install(params={}, callback) {
  let {
    // Main params
    basepath,
    env,
    shell,
    timeout,
    quiet,
    verbose,
    // Isolation / sandbox
    copyShared=true,
    hydrateShared=true
  } = params
  basepath = basepath || 'src'

  /**
   * Find our dependency manifests
   */
  // eslint-disable-next-line
  let pattern = p => `${p}/**/@(package\.json|requirements\.txt|Gemfile)`
  // Get everything except shared
  let files = glob.sync(pattern(basepath)).filter(function filter(filePath) {
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
    let sharedFiles = glob.sync(pattern(process.cwd())).filter(function filter(filePath) {
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
  // Windows
  if (process.platform.startsWith('win')) {
    files = files.map(file => file.replace(/\//gi, '\\'))
  }
  // Ensure all paths are relative; previous glob ops may be from absolute paths, producing absolute-pathed results
  files = files.map(file => {
    // Normalize to relative paths
    file = file.replace(process.cwd(),'')
    return file[0] === path.sep ? file.substr(1) : file // jiccya
  })

  /**
   * Filter by active project paths (and root, if applicable)
   */
  let inv = inventory()
  files = files.filter(file => {
    // Allow root project hydration of process.cwd() if passed as basepath
    let hydrateBasepath = basepath === process.cwd()
    if (hydrateBasepath && path.dirname(file) === '.')
      return true

    // Allow src/shared and src/views
    let isShared = path.join('src', 'shared')
    let isViews = path.join('src', 'views')
    if (file.startsWith(isShared) || file.startsWith(isViews))
      return true

    // Hydrate functions, of course
    return inv.localPaths.some(p => p === path.dirname(file))
  })

  /**
   * Build out job queue
   */
  let deps = files.length
  let updaterParams = {quiet}
  let update = updater('Hydrate', updaterParams)
  let p = basepath.substr(-1) === '/' ? `${basepath}/` : basepath
  let init = ''
  if (deps && deps > 0)
    init += update.status(`Hydrating dependencies in ${deps} path${deps > 1 ? 's' : ''}`)
  if (!deps && verbose)
    init += update.status(`No dependencies found in: ${p}${path.sep}**`)
  if (init) {
    init = {
      raw: {stdout: stripAnsi(init)},
      term: {stdout: init}
    }
  }

  let ops = files.map(file => {
    let cwd = path.dirname(file)
    let options = {cwd, env, shell, timeout}
    return function hydration(callback) {
      let start
      let now = Date.now()

      // Prints and executes the command
      function exec(cmd, opts, callback) {
        let relativePath = cwd !== '.' ? cwd : 'project root'
        let done = `Hydrated ${relativePath}`
        start = update.start(`Hydrating ${relativePath}`)

        child.exec(cmd, opts,
        function (err, stdout, stderr) {
          // If zero output, acknowledge *something* happened
          if (!err && !stdout && !stderr) {
            update.cancel()
            stdout = `Done in ${(Date.now() - now) / 1000}s`
          }
          let params = {err, stdout, stderr, cmd, done, start, update, verbose}
          print(params, callback)
        })
      }

      // TODO: I think we should consider what minimum version of node/npm this
      // module needs to use as the npm commands below have different behaviour
      // depending on npm version - and enshrine those in the package.json
      let exists = file => fs.existsSync(path.join(cwd, file))
      if (file.includes('package.json')) {
        if (exists('package-lock.json')) {
          exec(`npm ci`, options, callback)
        }
        else if (exists('yarn.lock')) {
          exec(`yarn`, options, callback)
        }
        else {
          exec(`npm i`, options, callback)
        }
      }

      if (file.includes('requirements.txt'))
        exec(`pip3 install -r requirements.txt -t ./vendor`, options, callback)

      if (file.includes('Gemfile'))
        exec(`bundle install --path vendor/bundle`, options, callback)
    }
  })

  // Usually run shared hydration
  if (copyShared) {
    ops.push(function (callback) {
      params.update = update
      shared(params, callback)
    })
  }

  series(ops, function done (err, result) {
    result = [].concat.apply([], result) // Flatten the nested shared array
    if (init) result.unshift(init) // Bump init logging to the top
    if (err) callback(err, result)
    else {
      if (deps && deps > 0) {
        let done = update.done('Success!', 'Finished hydrating dependencies')
        result.push({
          raw: {stdout: stripAnsi(done)},
          term: {stdout: done}
        })
      }
      if (!deps && !quiet) {
        let done = update.done('Finished checks, nothing to hydrate')
        result.push({
          raw: {stdout: stripAnsi(done)},
          term: {stdout: done}
        })
      }
      callback(null, result)
    }
  })
}
