let glob = require('glob')
let chalk = require('chalk')
let series = require('run-series')
let path = require('path')
let child = require('child_process')
let shared = require('./shared')

/**
 * updates dependencies to newer versions
*/
module.exports = function update(basepath='src', callback) {
  // eslint-disable-next-line
  let pattern = `${basepath}/**/@(package\.json|requirements\.txt|Gemfile)`

  let files = glob.sync(pattern).filter(function filter(filePath) {
    if (filePath.includes('node_modules'))
      return false
    if (filePath.includes('vendor/bundle'))
      return false
    return true
  })

  series(files.map(file=> {
    let cwd = path.dirname(file)
    let options = {cwd}
    return function updation(callback) {

      // printer function
      function exec(cmd, opts, callback) {
        console.log(chalk.green(cwd))
        console.log(chalk.bold.green(cmd))
        child.exec(cmd, opts, callback)
      }

      // also a printer function
      function done(err, stdout, stderr) {
        if (err) {
          console.log(chalk.bgRed.bold.white(err.message))
          console.log(chalk.grey(err.stack))
        }
        if (stdout && stdout.length > 0) {
          console.log(chalk.grey(stdout))
        }
        if (stderr && stderr.length > 0) {
          console.log(chalk.yellow(stderr))
        }
        if (err) callback(err)
        else callback()
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
  }).concat([shared]),
  function done(err) {
    if (err) callback(err)
    else callback()
  })
}
