let cp = require('cpr')
let fs = require('fs')
let path = require('path')
let { sync: rm } = require('rimraf')
let mkdirp = require('mkdirp')
let { sync: symlinkOrCopy } = require('symlink-or-copy')

module.exports = function copy (source, destination, params, callback) {
  if (params.sandbox) {
    try {
      if (fs.existsSync(destination)) {
        rm(destination)
      }
      mkdirp.sync(path.dirname(destination))
      symlinkOrCopy(source, destination)
    }
    catch (err) {
      callback(err)
      return
    }
    callback()
  }
  else {
    cp(source, destination, { overwrite: true }, function done (err) {
      if (err) callback(err)
      else callback()
    })
  }
}
