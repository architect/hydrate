let { dirname, join, sep } = require('path')
let { existsSync, readFileSync, writeFileSync } = require('fs')
let child = require('child_process')
let series = require('run-series')
let rm = require('rimraf')
let print = require('../_printer')
let phpInitComposer = require('../_php')

module.exports = function hydrator (params, callback) {
  let { file, action, update, env, shell, timeout, installing, verbose, viewsDir, sharedDir } = params
  let cwd = dirname(file)
  let options = { cwd, env, shell, timeout }
  let start
  let now = Date.now()
  let isRoot = cwd === '.'

  // Prints and executes the command
  function exec (cmd, opts, callback) {
    let relativePath = isRoot ? 'project root' : cwd
    let done = `${action}ed ${relativePath}${sep}`
    start = update.start(`${action}ing ${relativePath}${sep}`)

    child.exec(cmd, opts, function (err, stdout, stderr) {
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
  let isPhp = file.endsWith('composer.json') 
 
  series([
    function clear (callback) {
      if (installing) {
        // Remove existing package dir first to prevent side effects from symlinking
        let dir
        if (isJs) dir = join(cwd, 'node_modules')
        if (isPy) dir = join(cwd, 'vendor')
        if (isRb) dir = join(cwd, 'vendor', 'bundle')
        if (isPhp) dir = join(cwd, 'vendor')
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
        let prodFlag = isRoot ? '' : '--production'
        if (exists('package-lock.json')) {
          exec(`npm ci ${prodFlag}`, options, callback)
        }
        else if (exists('yarn.lock')) {
          let local = join(cwd, 'node_modules', 'yarn')
          let cmd = local ? `npx yarn ${prodFlag}` : `yarn ${prodFlag}`
          exec(cmd, options, callback)
        }
        else {
          exec(`npm i ${prodFlag}`, options, callback)
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

      // Install PHP deps
      else if (isPhp && installing) {
        phpInitComposer({cwd, sharedDir, viewsDir})
        exec(`composer dumpautoload -o && composer install --no-dev`, options, callback)
      }

      // Update PHP deps
      else if (isPhp && !installing) {
        phpInitComposer({cwd, sharedDir, viewsDir})
        exec(`composer dumpautoload -o && composer update --no-dev`, options, callback)
      }

      else {
        callback()
      }
    }
  ], callback)
}
