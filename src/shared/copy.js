let cp = require('cpr')
let { mkdirSync } = require('fs')
let { dirname } = require('path')
let { sync: rm } = require('rimraf')
let { sync: symlinkOrCopy } = require('symlink-or-copy')

module.exports = function copy (source, destination, params, callback) {
  let { symlink } = params
  try {
    // Toggling between symlink enabled/disabled can create weird side effects
    // Checking existence may result in false negative because a symlink may persist even when its linked file/dir does not (which would later crash a fresh symlink write)
    // tldr: always delete and start fresh
    rm(destination)
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
