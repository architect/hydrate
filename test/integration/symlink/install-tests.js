let { join, sep } = require('path')
let {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} = require('fs')
const { test } = require('node:test')
const assert = require('node:assert')
let {
  reset,
  resetAndCopyShared,
  resetAndCopySharedAutoinstall,
  checkFolderCreation,
  arcHttp,
  arcAutoinstall,
  nodeFunctions,
  pythonFunctions,
  pythonDependencies,
  rubyDependencies,
  nodeDependencies,
  pythonSharedDependencies,
  pythonViewsDependencies,
  rubySharedDependencies,
  rubyViewsDependencies,
  nodeSharedDependencies,
  nodeViewsDependencies,
  arcFileArtifacts,
  sharedArtifacts,
  viewsArtifacts,
  mockTmp,
} = require('../_shared')
let hydrate = require('../../..')
process.env.CI = true // Suppresses tape issues with progress indicator
let symlink = true

// As of late 2020, this test passes GHCI in both windows-latest and windows-2016
// This is strange, bc windows-2016 should be running a pre-Windows-symlink build (10.0.14393 Build 3930)
// See: https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
test(`[Symlinking] install() with symlink hydrates all Functions', shared and views dependencies (autoinstall enabled)`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      hydrate.install({ symlink, autoinstall: true }, function (err) {
        if (err) assert.fail(err)
        pythonDependencies.forEach(p => {
          assert.ok(existsSync(p), `python dependency exists at ${p}`)
        })
        rubyDependencies().forEach(p => {
          assert.ok(existsSync(p), `ruby dependency exists at ${p}`)
        })
        nodeDependencies.forEach(p => {
          assert.ok(existsSync(p), `node dependency exists at ${p}`)
        })
        pythonSharedDependencies.forEach(p => {
          assert.ok(existsSync(p), `python shared dependency exists at ${p}`)
        })
        rubySharedDependencies.forEach(p => {
          assert.ok(existsSync(p), `ruby shared dependency exists at ${p}`)
        })
        nodeSharedDependencies.forEach(p => {
          assert.ok(existsSync(p), `node shared dependency exists at ${p}`)
        })
        pythonViewsDependencies.forEach(p => {
          assert.ok(existsSync(p), `python views dependency exists at ${p}`)
        })
        rubyViewsDependencies.forEach(p => {
          assert.ok(existsSync(p), `ruby views dependency exists at ${p}`)
        })
        nodeViewsDependencies.forEach(p => {
          assert.ok(existsSync(p), `node views dependency exists at ${p}`)
        })
        // Autoinstall-specific tests
        let package = join(arcAutoinstall[0], 'node_modules', '_arc-autoinstall', 'package.json')
        assert.ok(existsSync(package), 'Found autoinstall package.json')
        let requirements = join(arcAutoinstall[1], 'vendor', '_arc_autoinstall', 'requirements.txt')
        assert.ok(existsSync(requirements), 'Found autoinstall requirements.txt')
        // Yarn-specific tests
        let yarnFunction = join(mockTmp, 'src', 'http', 'put-on_your_boots')
        let yarnIntFile = join(yarnFunction, 'node_modules', '.yarn-integrity')
        let pkgLockFile = join(yarnFunction, 'package-lock.json')
        assert.ok(existsSync(yarnIntFile), 'Found yarn integrity file')
        assert.ok(!existsSync(pkgLockFile), `Did not find package-lock.json (i.e. npm didn't run)`)
        // pnpm-specific tests
        let pnpmFunction = join(mockTmp, 'src', 'http', 'options-are_plentiful')
        let pnpmIntFile = join(pnpmFunction, 'node_modules', '.modules.yaml')
        pkgLockFile = join(pnpmFunction, 'package-lock.json')
        assert.ok(existsSync(pnpmIntFile), 'Found pnpm integrity file')
        assert.ok(!existsSync(pkgLockFile), `Did not find package-lock.json (i.e. npm didn't run)`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Symlinking] install() hydrates all Functions', shared and views dependencies (autoinstall enabled, no package files in shared)`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedAutoinstall(function () {
      hydrate.install({ symlink, autoinstall: true }, function (err) {
        if (err) assert.fail(err)
        // Autoinstall-specific tests
        let package = join(arcAutoinstall[0], 'node_modules', '_arc-autoinstall', 'package.json')
        assert.ok(existsSync(package), 'Found autoinstall package.json')
        let autoinstall = JSON.parse(readFileSync(package))
        let _parsed = [
          'index.js',
          `src${sep}shared${sep}shared.js`,
          `src${sep}views${sep}views.js`,
        ]
        let dependencies = {
          cpr: 'latest',
          'run-series': 'latest',
          'tiny-json-http': 'latest',
        }
        assert.deepStrictEqual(autoinstall._parsed, _parsed, 'Autoinstall walked shared + views')
        assert.deepStrictEqual(autoinstall.dependencies, dependencies, 'Autoinstall installed shared + views deps')
        // Check to see if files that are supposed to be there are actually there
        assert.ok(existsSync(nodeDependencies[1]), `scoped install for ${nodeFunctions[0]} installed dependencies in ${nodeDependencies[1]}`)
        let path = join(arcHttp[2], 'node_modules')
        let sharedDep = join(path, 'cpr')
        let viewsDep = join(path, 'run-series')
        assert.ok(existsSync(sharedDep), 'Autoinstalled shared dependency')
        assert.ok(existsSync(viewsDep), 'Autoinstalled views dependency')
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Symlinking] install (specific path / single path) hydrates only Functions found in the specified subpath`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      let basepath = nodeFunctions[0]
      hydrate.install({ basepath, symlink }, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        assert.ok(existsSync(nodeDependencies[0]), `scoped install for ${nodeFunctions[0]} installed dependencies in ${nodeDependencies[0]}`)
        assert.ok(!existsSync(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcHttp[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcHttp[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcHttp[0]))
        assert.ok(existsSync(nodeSharedDependencies[0]), `node shared dependency exists at ${nodeSharedDependencies[0]}`)
        assert.ok(existsSync(nodeViewsDependencies[0]), `node views dependency exists at ${nodeViewsDependencies[0]}`)
        assert.ok(!existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        assert.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        assert.ok(existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Symlinking] install (specific path / single path) in a manifest-free Node.js function adds missing deps with autoinstall enabled`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      let basepath = nodeFunctions[1]
      hydrate.install({ basepath, symlink, autoinstall: true }, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        assert.ok(existsSync(nodeDependencies[1]), `scoped install for ${nodeFunctions[1]} installed dependencies in ${nodeDependencies[1]}`)
        assert.ok(!existsSync(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        assert.ok(existsSync(nodeSharedDependencies[1]), `node shared dependency exists at ${nodeSharedDependencies[1]}`)
        assert.ok(!existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        assert.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        assert.ok(!existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Default (file copying)] install (specific path / single path) in a manifest-free Python function adds missing deps with autoinstall enabled`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      let basepath = pythonFunctions[1]
      hydrate.install({ basepath, symlink, autoinstall: true }, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        assert.ok(existsSync(pythonDependencies[1]), `scoped install for ${pythonFunctions[1]} installed dependencies in ${pythonDependencies[1]}`)
        assert.ok(!existsSync(nodeDependencies[0]), `scoped install did not install dependencies for unspecified function at ${nodeDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        assert.ok(existsSync(pythonSharedDependencies[1]), `python shared dependency exists at ${pythonSharedDependencies[1]}`)
        assert.ok(!existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        assert.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        assert.ok(!existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Default (file copying)] install (specific path / single path) in a manifest-free Python function does not add missing deps with autoinstall disabled`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      let basepath = pythonFunctions[1]
      hydrate.install({ basepath, autoinstall: false }, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        assert.ok(!existsSync(pythonDependencies[1]), `scoped install for ${pythonFunctions[1]} installed dependencies in ${pythonDependencies[1]}`)
        assert.ok(!existsSync(nodeDependencies[0]), `scoped install did not install dependencies for unspecified function at ${nodeDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        assert.ok(existsSync(pythonSharedDependencies[1]), `python shared dependency exists at ${pythonSharedDependencies[1]}`)
        assert.ok(!existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        assert.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        assert.ok(!existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Symlinking] install (specific path / single path) in a manifest-free Node.js function does not add missing deps with autoinstall disabled`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      let basepath = nodeFunctions[1]
      hydrate.install({ basepath, symlink, autoinstall: false }, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        assert.ok(!existsSync(nodeDependencies[1]), `scoped install for ${nodeFunctions[1]} installed dependencies in ${nodeDependencies[1]}`)
        assert.ok(!existsSync(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcAutoinstall[0]))
        assert.ok(existsSync(nodeSharedDependencies[1]), `node shared dependency exists at ${nodeSharedDependencies[1]}`)
        assert.ok(!existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        assert.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        assert.ok(!existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Symlinking] install() should not recurse into Functions dependencies and hydrate those`, async () => {
  await new Promise((resolve) => {
    reset(function () {
      let subdep = join(nodeFunctions[0], 'node_modules', 'poop')
      mkdirSync(subdep, { recursive: true })
      writeFileSync(join(subdep, 'package.json'), JSON.stringify({
        name: 'poop',
        dependencies: { 'tiny-json-http': '*' },
      }), 'utf-8')
      let basepath = nodeFunctions[0]
      hydrate.install({ basepath, symlink }, function (err) {
        if (err) assert.fail(err)
        let submod = join(subdep, 'node_modules')
        assert.ok(!existsSync(submod), `install did not recurse into node subdependencies at ${submod}`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})
