let { existsSync } = require('fs')
let { join } = require('path')
let getRootDeps = require('./get-root-deps')
let getSharedDeps = require('./get-shared-deps')
let getLambdaDeps = require('./get-lambda-deps')

let sdkInfo = 'Architect does not manage AWS SDK, thus this code may be broken when deployed. See more at: https://arc.codes/aws-sdk-versions'
let sdkV2 = `'aws-sdk' (v2)`
let sdkV3short = `'@aws-sdk/*' (v3)`
let sdkV3long = `one or more ${sdkV3short} modules`

module.exports = function treeshakeNode (nodeDirs, params) {
  let { cwd, inventory, update } = params

  // Generated manifests to be hydrated later (if there are no parsing failures)
  let installing = []

  // Userland files that could not be parsed
  let failures = []

  // Get package[-lock] dependencies
  let allDeps = getRootDeps(inventory)

  // Stats
  let projectDirs = 0
  let projectFiles = 0
  let nodeDeps = 0

  // Aggregate shared + views deps
  let shared = getSharedDeps({ cwd, inventory, update })
  let {
    sharedDeps, sharedFiles, sharedAwsSdkV2, sharedAwsSdkV3,
    viewsDeps, viewsFiles, viewsAwsSdkV2, viewsAwsSdkV3,
  } = shared
  projectDirs += shared.projectDirs
  projectFiles += shared.projectFiles

  // Complain about possible shared code / AWS SDK issues
  let foundSharedIssueWithAwsSdkV2 = 0, foundSharedIssueWithAwsSdkV3 = 0, foundViewsIssueWithAwsSdkV2 = 0, foundViewsIssueWithAwsSdkV3 = 0
  Object.values(inventory.inv.lambdasBySrcDir).forEach(lambda => {
    if (Array.isArray(lambda)) lambda = lambda[0] // Multi-tenant Lambda check

    let { runtime, shared, views } = lambda.config
    if (!runtime.startsWith('nodejs')) return
    let hasSdkV3 = runtime >= 'nodejs18.x'
    let hasSdkV2 = runtime < 'nodejs18.x'
    if (!foundSharedIssueWithAwsSdkV2 && shared && sharedAwsSdkV2 && hasSdkV3) foundSharedIssueWithAwsSdkV2++
    if (!foundSharedIssueWithAwsSdkV3 && shared && sharedAwsSdkV3 && hasSdkV2) foundSharedIssueWithAwsSdkV3++
    if (!foundViewsIssueWithAwsSdkV2 && views && viewsAwsSdkV2 && hasSdkV3) foundViewsIssueWithAwsSdkV2++
    if (!foundViewsIssueWithAwsSdkV3 && views && viewsAwsSdkV3 && hasSdkV2) foundViewsIssueWithAwsSdkV3++
  })

  let sharedWarnings = []
  if (foundSharedIssueWithAwsSdkV2) sharedWarnings.push(`- Found shared code that imports or requires ${sdkV2}; ${foundSharedIssueWithAwsSdkV2} Lambda(s) only have ${sdkV3short} built in`)
  if (foundSharedIssueWithAwsSdkV3) sharedWarnings.push(`- Found shared code that imports or requires ${sdkV3long}; ${foundSharedIssueWithAwsSdkV3} Lambda(s) only have ${sdkV2} built in`)
  if (foundViewsIssueWithAwsSdkV2) sharedWarnings.push(`- Found views code that imports or requires ${sdkV2}; ${foundViewsIssueWithAwsSdkV2} Lambda(s) only have ${sdkV3short} built in`)
  if (foundViewsIssueWithAwsSdkV3) sharedWarnings.push(`- Found views code that imports or requires ${sdkV3long}; ${foundViewsIssueWithAwsSdkV3} Lambda(s) only have ${sdkV2} built in`)
  if (sharedWarnings.length) {
    sharedWarnings.unshift('Found possible AWS SDK version mismatches in Architect shared code')
    sharedWarnings.push(sdkInfo)
    update.warn(sharedWarnings.join('\n'))
  }

  let v2Warnings = []
  let v3Warnings = []

  nodeDirs.forEach(dir => {
    projectDirs++
    let lambda = inventory.inv.lambdasBySrcDir?.[dir]
    if (!lambda) lambda = inventory.inv.http?.find(l => l.arcStaticAssetProxy)
    if (Array.isArray(lambda)) lambda = lambda[0] // Multi-tenant Lambda check
    let { config, name, pragma } = lambda
    let { runtime } = config
    let ignored = config.ignoreDependencies || config.ignoredDependencies

    try {
      let result = getLambdaDeps({ dir, update, inventory, ignored })
      let { deps, files, awsSdkV2, awsSdkV3 } = result
      projectFiles += files.length
      failures = failures.concat(result.failures)

      let hasSdkV3 = runtime >= 'nodejs18.x'
      if (hasSdkV3 && awsSdkV2) {
        v2Warnings.push(`- '@${pragma} ${name}' (runtime: '${runtime}')`)
      }
      if (!hasSdkV3 && awsSdkV3) {
        v3Warnings.push(`- '@${pragma} ${name}' (runtime: '${runtime}')`)
      }

      if (config.shared) {
        deps = deps.concat(sharedDeps)
        files = files.concat(sharedFiles)
      }
      if (config.views) {
        deps = deps.concat(viewsDeps)
        files = files.concat(viewsFiles)
      }
      deps = [ ...new Set(deps.sort()) ] // Dedupe

      // Exit now if there are no deps to write or the Lambda is in the project root
      if (!deps.length) return
      if (dir === cwd && deps.length) {
        update.warn(`@${pragma} ${name} handler in project root skipped during Lambda treeshaking`)
        return
      }
      nodeDeps += deps.length

      // Build the manifest
      let dependencies = {}
      deps.forEach(dep => dependencies[dep] = allDeps[dep] || 'latest')
      let lambdaPackage = {
        _arc: 'autoinstall',
        _module: 'hydrate',
        _date: new Date().toISOString(),
        _parsed: files.sort(),
        description: `This file was generated by Architect, and placed in node_modules to aid in debugging; if you found file in your function directory, you can safely remove it (and package-lock.json)`,
        dependencies,
      }
      let params = {
        dir,
        file: 'package.json',
        remove: [ 'package.json', 'package-lock.json' ], // Identify files for later removal
        data: JSON.stringify(lambdaPackage, null, 2),
      }
      // Autoinstall can be called on a directory that contains a package.json with `"type": "module"` (and no dependencies)
      // If we find such a case, kindly move the existing package.json aside until autoinstall ops are complete
      if (existsSync(join(dir, 'package.json'))) {
        params.swap = 'package.json.bak'
      }
      installing.push(params)
    }
    catch (err) {
      update.error(`Error autoinstalling dependencies in ${dir}`)
      throw err
    }
  })

  let plural = arr => arr.length > 1
  let msg = (plural, dep) => `The following function${plural ? 's' : ''} requires or imports ${dep}, which is not built into your Lambda${plural ? `s'` : `'s`} runtime:`
  let depWarnings = []
  if (v2Warnings.length) {
    depWarnings.push(
      msg(plural(v2Warnings), sdkV2),
      ...v2Warnings,
    )
  }
  if (v3Warnings.length) {
    depWarnings.push(
      msg(plural(v3Warnings), sdkV3long),
      ...v3Warnings,
    )
  }
  if (depWarnings.length) {
    depWarnings.unshift('Found possible AWS SDK version mismatches in Lambda handler code')
    depWarnings.push(sdkInfo)
    update.warn(depWarnings.join('\n'))
  }

  // Halt hydration (and deployment) if there are dependency determination issues
  if (failures.length) {
    update.error('JS parsing error(s), could not automatically determine dependencies')
    failures.forEach(({ file, error }) => {
      console.log('File:', file)
      console.log(error)
    })
    process.exit(1)
  }

  return {
    installing,
    projectDirs,
    projectFiles,
    nodeDeps,
  }
}
