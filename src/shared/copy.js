let cp = require('cpr')
let fs = require('fs')
let path = require('path')
let rimrafSync = require('rimraf').sync
let mkdirp = require('mkdirp')
let symlinkOrCopySync = require('symlink-or-copy').sync

module.exports = function copy(source, destination, params, callback) {
  if (params.sandbox) {
    try {
      if (fs.existsSync(destination)) {
        rimrafSync(destination)
      }
      mkdirp.sync(path.dirname(destination))
      symlinkOrCopySync(source, destination)
    } catch (err) {
      callback(err)
      return
    }
    callback()
  } else {
    cp(source, destination, { overwrite: true }, function done(err) {
      if (err) callback(err)
      else callback()
    })
  }
}
