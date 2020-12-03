let parse = require('@architect/parser')
let cp = require('./copy')
let { existsSync, readFileSync, writeFileSync } = require('fs')
let { join } = require('path')
let series = require('run-series')
let print = require('../_printer')

/**
 * copies the current .arc, app.arc, arc.yaml or arc.json manifest
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs*  | node_modules/@architect/shared/.arc
 * else     | vendor/shared/.arc
 */
module.exports = function copyArc (params, paths, callback) {
  let { update, only } = params
  let go = !only || only === 'arcFile' || only === 'shared'

  if (process.env.DEPRECATED && go) {
    // Kick off logging
    let done = `Hydrated app with Architect manifest`
    let start = update.start(`Hydrating app with Architect manifest`)

    let destinations = Object.entries(paths).map(p => p[1])
    series(destinations.map(dest => {
      return function copier (callback) {
        copy(join(dest, 'shared'), params, callback)
      }
    }), function _done (err) {
      let cmd = 'copy'
      if (err) print({ cmd, err, start, update }, callback)
      else print({ cmd, start, done, update }, callback)
    })
  }
  else callback()
}

/**
 * copy the current manifest into the destination dir
 */
function copy (dest, params, callback) {
  let cwd = process.cwd()
  // path to destination
  let arcFileDest = join(dest, '.arc')
  // .arc in current working dir
  let arcFileSrc = join(cwd, '.arc')
  // fallback: app.arc in current working dir
  let arcAppDotArcPath = join(cwd, 'app.arc')
  // fallback: arc.yaml in current working dir
  let arcYamlPath = join(cwd, 'arc.yaml')
  // fallback: arc.json in current working dir
  let arcJsonPath = join(cwd, 'arc.json')

  if (existsSync(arcFileSrc)) {
    cp(arcFileSrc, arcFileDest, params, callback)
  }
  else if (existsSync(arcAppDotArcPath)) {
    cp(arcAppDotArcPath, arcFileDest, params, callback)
  }
  else if (existsSync(arcYamlPath)) {
    let raw = readFileSync(arcYamlPath).toString()
    let arc = parse.yaml.stringify(raw)
    writeFileSync(arcFileDest, arc)
    callback()
  }
  else if (existsSync(arcJsonPath)) {
    let raw = readFileSync(arcJsonPath).toString()
    let arc = parse.json.stringify(raw)
    writeFileSync(arcFileDest, arc)
    callback()
  }
}
