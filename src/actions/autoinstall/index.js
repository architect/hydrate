let { existsSync, readFileSync, writeFileSync } = require('fs')
let { join } = require('path')
let { sync: glob } = require('glob')
let rm = require('rimraf').sync
let { ignoreDeps, stripCwd } = require('../../lib')
let getRequires = require('./get-requires')

module.exports = function autoinstaller (params) {
  let { dirs, inventory, update } = params
  if (!dirs.length) return []

  // List of files we just auto-generated package.jsons for
  let installing = []

  // Get package.json contents and map out root dependencies
  let packageJson = join(process.cwd(), 'package.json')
  let package = existsSync(packageJson) && JSON.parse(readFileSync(packageJson)) || {}
  let packageJsonDeps = Object.assign(package.devDependencies || {}, package.dependencies || {})

  dirs.forEach(dir => {
    let lambda = inventory.inv.lambdasBySrcDir[dir]
    if (Array.isArray(lambda)) lambda = lambda[0] // Handle multitenant Lambdae

    // Autoinstall is currently Node.js only - exit early if it's another runtime
    if (!lambda.config.runtime.startsWith('nodejs')) return
    try {
      // Clean everything out bebefore we get going jic
      rm(join(dir, 'node_modules'))
      // Gather ye business logic while ye may
      let files = glob('**/*.js', { cwd: dir }).filter(ignoreDeps)

      files.forEach(f => {
        let deps = getRequires({ dir, file: join(dir, f), update })
        if (deps) {
          deps = deps.filter(d => d !== 'aws-sdk') // Already present at runtime
          deps = [ ...new Set(deps.sort()) ] // Dedupe
          let dependencies = {}
          deps.forEach(dep => dependencies[dep] = packageJsonDeps[dep] || 'latest')
          let lambdaPackage = {
            _arc: 'hydrate-autoinstall',
            description: `This file, .arc-autoinstall, and package-lock.json should have been deleted by Architect after deployment, and can all be safely be removed`,
            dependencies,
          }
          let marker = join(dir, '.arc-autoinstall')
          let packageJson = join(dir, 'package.json')
          let data = JSON.stringify(lambdaPackage, null, 2)
          writeFileSync(packageJson, data)
          writeFileSync(marker, 'package.json\npackage-lock.json') // Identify later deletions
          installing.push(stripCwd(packageJson))
        }
      })
    }
    catch (err) {
      update.error(`Error autoinstalling dependencies in ${dir}`)
      throw err
    }
  })
  return installing
}
