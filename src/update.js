let glob = require('glob')
let series = require('run-series')
let path = require('path')
let print = require('./_printer')
let child = require('child_process')
let shared = require('./shared')
let {updater} = require('@architect/utils')

/**
 * updates dependencies to newer versions
*/
module.exports = function update(params={}, callback) {
  let {basepath, env, quiet, shell, timeout, verbose} = params
  basepath = basepath || 'src'

  let update = updater('Hydrate')
  let p = basepath.substr(-1) === '/' ? basepath : `${basepath}/`

  // eslint-disable-next-line
  let pattern = `${basepath}/**/@(package\.json|requirements\.txt|Gemfile)`

  let files = glob.sync(pattern).filter(function filter(filePath) {
    if (filePath.includes('node_modules'))
      return false
    if (filePath.includes('vendor/bundle'))
      return false
    return true
  })

  let deps = files.length

  if (deps && deps > 0)
    update.status(`Updating dependencies in ${deps} function${deps > 1 ? 's' : ''}`)

  if (!deps && verbose)
    update.status(`No dependencies found to update in: ${p}`)

  let ops = files.map(file=> {
    let cwd = path.dirname(file)
    let options = {cwd, env, shell, timeout}
    return function updation(callback) {
      let start
      let cmd
      let now = Date.now()

      // printer function
      function exec(command, opts, callback) {
        cmd = command
        let action = 'Updating'
        start = print.start({cwd, action, quiet, verbose})
        child.exec(cmd, opts, callback)
      }

      // also a printer function
      function done(err, stdout, stderr) {
        // If zero output, acknowledge *something* happened
        if (!err && !stdout && !stderr) stdout = `done in ${(Date.now() - now) / 1000}s`
        print.done({err, stdout, stderr, cmd, start, quiet, verbose}, callback)
      }

      if (file.includes('package.json')) {
        exec(`npm update`, options, done)
      }

      // TODO: pip requires manual locking (via two requirements.txt files) so
      // we dont test update w/ python
      // it may not make sense to execute this at all
      if (file.includes('requirements.txt'))
        exec(`pip3 install -r requirements.txt -t ./vendor -U --upgrade-strategy eager`, options, done)

      if (file.includes('Gemfile'))
        exec(`bundle update`, options, done)
    }
  })

  // If installing to everything, run shared operations
  if (basepath === 'src') ops.push(shared)

  series(ops, function done(err) {
    if (err) callback(err)
    else callback()
  })
}
