let { deepFrozenCopy } = require('@architect/utils')
let cp = require('./copy')
let { basename, join, isAbsolute } = require('path')
let { existsSync } = require('fs')
let series = require('run-series')

module.exports = function runCopyPlugins (params, paths, callback) {
  let { inventory } = params
  let { inv } = inventory
  let { lambdasBySrcDir, lambdaSrcDirs } = inv
  let { cwd } = inv._project
  let copyPlugins = inv.plugins?._methods?.hydrate?.copy
  if (copyPlugins && lambdaSrcDirs?.length) {
    let frozen = deepFrozenCopy(inventory)
    let { arc } = frozen.inv._project

    async function runPlugins () {
      for (let plugin of copyPlugins) {
        let pluginID = `: plugin: ${plugin._plugin}, method: hydrate.copy`

        async function copy (result) {
          if (!result || typeof result !== 'object') throw ReferenceError(`Invalid copy plugin parameters:${pluginID}`)

          // One or more files may be passed to copy
          let files = Array.isArray(result) ? result : [ result ]

          await Promise.all(files.map(item => {
            return new Promise((res, rej) => {
              let { source, target } = item
              if (!source) return rej(ReferenceError(`must return 'source' path`))

              // Make sure we normalize source paths to absolute
              let src = isAbsolute(source) ? source : join(cwd, source)
              if (!existsSync(src)) return rej(ReferenceError(`'source' path '${source}' not found in project`))

              if (target && isAbsolute(target)) return rej(ReferenceError(`'target' path '${target}' cannot be absolute`))

              // Sure what's one more nested sequence of ops?
              series(lambdaSrcDirs.map(dir => {
                return function copier (callback) {
                  let lambda = lambdasBySrcDir[dir]
                  if (Array.isArray(lambda)) lambda = lambda[0] // Multi-tenant Lambda check
                  let isNode = lambda.config?.runtimeConfig?.baseRuntime?.startsWith('nodejs') ||
                               lambda.config.runtime.startsWith('nodejs')
                  let filename = target || basename(source)
                  let base = lambda.build || lambda.src
                  let nodeModules = join(base, 'node_modules', filename)
                  let vendorDir = join(base, 'vendor', filename)
                  let dest = isNode ? nodeModules : vendorDir
                  cp(src, dest, params, callback)
                }
              }), function _done (err) {
                if (err) rej(err)
                else res()
              })
            })
          }))
        }

        try {
          await plugin({ arc, inventory: frozen, copy })
        }
        catch (err) {
          err.message = `Hydrate plugin exception${pluginID}, ${err.message}`
          throw err
        }
      }
    }
    runPlugins()
      .then(() => callback())
      .catch(callback)
  }
  else callback()
}
