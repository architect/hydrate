let { cp, mkdirSync } = require('fs')
let { dirname } = require('path')
let { sync: symlinkOrCopy } = require('symlink-or-copy')
let { destroyPath } = require('../lib')

module.exports = function copy (source, destination, params, callback) {
  let { symlink } = params
  try {
    // Toggling between symlink enabled/disabled can create weird side effects
    // Checking existence may result in false negative because a symlink may persist even when its linked file/dir does not (which would later crash a fresh symlink write)
    // tldr: always delete and start fresh
    destroyPath(destination)
    mkdirSync(dirname(destination), { recursive: true })
    if (symlink) {
      symlinkOrCopy(source, destination)
      callback()
    }
    else {
      cp(source, destination, { recursive: true, force: true }, callback)
    }
  }
  catch (err) {
    callback(err)
  }
}
