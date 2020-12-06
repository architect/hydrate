let { existsSync, readFileSync, writeFileSync } = require('fs')
let { join } = require('path')
let { sync: glob } = require('glob')
let rm = require('rimraf').sync
let { ignoreDeps, stripCwd } = require('../../lib')
let getRequires = require('./get-requires')

module.exports = function autoinstaller (params) {
  let { dirs, inventory, update, verbose } = params
  if (!dirs.length) return []

  let writes = []     // Manifests to be written if there are no parsing failures
  let failures = []   // Userland files that could not be parsed
  let installing = [] // Generated manifests to be hydrated later

  // Get package.json contents and map out root dependencies
  let packageJson = join(process.cwd(), 'package.json')
  let package = existsSync(packageJson) && JSON.parse(readFileSync(packageJson)) || {}
  let packageJsonDeps = Object.assign(package.devDependencies || {}, package.dependencies || {})

  update.start('Finding dependencies')
  // Stats
  let start = Date.now()
  let projectDirs = 0
  let projectFiles = 0
  let totalDeps = 0

  dirs.forEach(dir => {
    projectDirs++
    let lambda = inventory.inv.lambdasBySrcDir[dir]
    if (Array.isArray(lambda)) lambda = lambda[0] // Handle multitenant Lambdae

    // Autoinstall is currently Node.js only - exit early if it's another runtime
    if (!lambda.config.runtime.startsWith('nodejs')) return
    try {
      // Clean everything out bebefore we get going jic
      rm(join(dir, 'node_modules'))

      // Collection of all dependencies from all files in this directory
      let dirDeps = []

      // Gather ye business logic while ye may
      let files = glob('**/*.js', { cwd: dir }).filter(ignoreDeps)
      files.forEach(f => {
        projectFiles++
        try {
          let deps = getRequires({ dir, file: join(dir, f), update })
          if (deps) dirDeps = dirDeps.concat(deps)
        }
        catch (error) {
          failures.push({ file: join(dir, f), error })
        }
      })

      // Tidy up the dependencies
      dirDeps = [ ...new Set(dirDeps.sort()) ] // Dedupe
      dirDeps = dirDeps.filter(d => d !== 'aws-sdk') // Already present at runtime

      // Exit now if there are no deps to write
      if (!dirDeps.length) return
      totalDeps += dirDeps.length

      // Build the manifest
      let dependencies = {}
      dirDeps.forEach(dep => dependencies[dep] = packageJsonDeps[dep] || 'latest')
      let lambdaPackage = {
        _arc: 'hydrate-autoinstall',
        description: `This file, .arc-autoinstall, and package-lock.json should have been deleted by Architect after deployment; all can be safely be removed`,
        dependencies,
      }
      writes.push({
        dir,
        file: 'package.json',
        del: 'package.json\npackage-lock.json', // Identify files for later deletion
        data: JSON.stringify(lambdaPackage, null, 2)
      })
    }
    catch (err) {
      update.error(`Error autoinstalling dependencies in ${dir}`)
      throw err
    }
  })

  // Halt hydration (and deployment) if there are dependency determination issues
  if (failures.length) {
    update.error('JS parsing error(s), could not automatically determine dependencies')
    failures.forEach(({ file, error }) => {
      console.log('File:', file)
      console.log(error)
    })
    process.exit(1)
  }

  // Write everything at the end in case there were any parsing errors
  writes.forEach(({ dir, file, data, del }) => {
    let marker = join(dir, '.arc-autoinstall')
    let manifest = join(dir, file)
    writeFileSync(marker, del)
    writeFileSync(manifest, data)
    installing.push(stripCwd(manifest))
  })

  if (verbose) {
    let stats = [
      `Scanned ${projectDirs} project dirs`,
      `Inspected ${projectFiles} project files`,
      `Found a total of ${totalDeps} dependencies to install`
    ]
    update.status('Dependency analysis', ...stats)
    update.done(`Completed in ${Date.now() - start}ms`)
  }
  else update.cancel()

  return installing
}
