let glob = require('glob')
let series = require('run-series')
let fs = require('fs')
let path = require('path')
let print = require('./_printer')
let child = require('child_process')
let shared = require('./shared')

/**
  installs deps into
  - functions
  - src/shared
  - src/views
*/
module.exports = function install(basepath='src', callback) {
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
    return function hydration(callback) {

      // printer function
      function exec(cmd, opts, callback) {
        print.start(cwd, cmd)
        child.exec(cmd, opts, callback)
      }

      // also a printer function
      function done(err, stdout, stderr) {
        print.done(err, stdout, stderr, callback)
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
  }).concat([shared]),
  function done(err) {
    if (err) callback(err)
    else callback()
  })
}
