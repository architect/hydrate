let cp = require('cpr')
let { existsSync: exists, mkdirSync: mkdir } = require('fs')
let { dirname } = require('path')
let { sync: rm } = require('rimraf')
let { sync: symlinkOrCopy } = require('symlink-or-copy')

module.exports = function copy (source, destination, params, callback) {
  if (params.symlink) {
    try {
      if (exists(destination)) {
        rm(destination)
      }
      mkdir(dirname(destination), { recursive: true })
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
