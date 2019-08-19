let chalk = require('chalk')
let glob = require('glob')
let series = require('run-series')
let fs = require('fs')
let path = require('path')
let print = require('./_printer')
let child = require('child_process')
let shared = require('./shared')
let {inventory, updater} = require('@architect/utils')

/**
  installs deps into
  - functions
  - src/shared
  - src/views
*/
module.exports = function install(params={}, callback) {
  let {basepath, env, quiet, shell, timeout, verbose} = params
  basepath = basepath || 'src'

  let update = updater('Hydrate')
  let p = basepath.substr(-1) === '/' ? `${basepath}/` : basepath

  // eslint-disable-next-line
  let pattern = `${basepath}/**/@(package\.json|requirements\.txt|Gemfile)`

  let files = glob.sync(pattern).filter(function filter(filePath) {
    if (filePath.includes('node_modules'))
      return false
    if (filePath.includes('vendor/bundle'))
      return false
    return true
  })

  let inv = inventory()
  files = files.filter(file => {
    if (process.platform.startsWith('win')) file = file.replace(/\//gi, '\\')
    let cwd = path.dirname(file)
    let isShared = path.join('src', 'shared')
    let isViews = path.join('src', 'views')
    if (cwd === isShared || cwd === isViews)
      return true
    return inv.localPaths.some(p => p === cwd)
  })

  let deps = files.length

  if (deps && deps > 0)
    update.status(`Hydrating dependencies in ${deps} function${deps > 1 ? 's' : ''}`)

  if (!deps && verbose)
    update.status(`No dependencies found in: ${p}${path.sep}**`)

  let ops = files.map(file=> {
    let cwd = path.dirname(file)
    let options = {cwd, env, shell, timeout}
    return function hydration(callback) {
      let start
      let cmd
      let now = Date.now()

      // Prints and executes the command
      function exec(command, opts, callback) {
        cmd = command
        let action = 'Hydrating'
        start = print.start({cwd, action, quiet, verbose})
        child.exec(cmd, opts, callback)
      }

      // Prints the result
      function done(err, stdout, stderr) {
        // If zero output, acknowledge *something* happened
        if (!err && !stdout && !stderr) stdout = `done in ${(Date.now() - now) / 1000}s`
        print.done({err, stdout, stderr, cmd, start, quiet, verbose}, callback)
      }

      // TODO: I think we should consider what minimum version of node/npm this
      // module needs to use as the npm commands below have different behaviour
      // depending on npm version - and enshrine those in the package.json
      if (file.includes('package.json')) {
        if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
          exec(`npm ci`, options, done)
        }
        else {
          exec(`npm i`, options, done)
        }
      }

      if (file.includes('requirements.txt'))
        exec(`pip3 install -r requirements.txt -t ./vendor`, options, done)

      if (file.includes('Gemfile'))
        exec(`bundle install --path vendor/bundle`, options, done)
    }
  })

  // If installing to everything, run shared operations
  if (basepath === 'src') ops.push(shared)

  series(ops, (err, result) => {
    if (err) callback(err)
    else {
      if (deps && deps > 0)
        update.done('Success!', chalk.green('Finished hydrating dependencies'))
      if (!deps)
        update.done('Finished checks, nothing to hydrate')

      callback(null, result)
    }
  })
}
