let cp = require('cpr')
let { existsSync, mkdirSync } = require('fs')
let { dirname } = require('path')
let { sync: rm } = require('rimraf')
let { sync: symlinkOrCopy } = require('symlink-or-copy')

module.exports = function copy (source, destination, params, callback) {
  let { symlink } = params
  try {
    // Toggling between symlink enabled/disabled can create weird side effects
    // Always try to remove the destination if it exists
    if (existsSync(destination)) {
      rm(destination)
    }
    mkdirSync(dirname(destination), { recursive: true })
    if (symlink) {
      symlinkOrCopy(source, destination)
      callback()
    }
    else {
      cp(source, destination, { overwrite: true }, callback)
    }
  }
  catch (err) {
    callback(err)
  }
}
