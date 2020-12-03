let { dirname, join } = require('path')
let {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} = require('fs')
let cp = require('cpr')
let test = require('tape')
let {
  reset,
  resetAndCopyShared,
  checkFolderCreation,
  arcHttp,
  rubyFunctions,
  nodeFunctions,
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
  staticArtifacts,
  sharedArtifacts,
  sharedArtifactsDisabled,
  getViewsArtifacts,
  viewsArtifacts,
  viewsArtifactsDisabled,
  mockTmp,
} = require('./_shared')
let hydrate = require('../../')
process.env.CI = true // Suppresses tape issues with progress indicator
let symlink = true

// As of late 2020, this test passes GHCI in both windows-latest and windows-2016
// This is strange, bc windows-2016 should be running a pre-Windows-symlink build (10.0.14393 Build 3930)
// See: https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
test(`[Symlinking] shared() never uses symlinks by default`, t => {
  t.plan(2)
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        let path = 'src/http/get-index/node_modules/@architect/shared'
        let file = path + '/shared.md'
        let stat = lstatSync(path).isSymbolicLink()
        t.ok(stat, 'shared directory is a symlink')
        t.equal(readFileSync(file).toString(), 'It me!', 'Symlinked file is readable')
      }
    })
  })
})

test(`[Symlinking] shared() copies src/shared and src/views (unless disabled or folder not found; @views not specified)`, t => {
  t.plan(
    sharedArtifacts.length +
    getViewsArtifacts.length +
    sharedArtifactsDisabled.length +
    viewsArtifactsDisabled.length + 1
  )
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        sharedArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found shared file in ${path}`)
        })
        sharedArtifactsDisabled.forEach(path => {
          t.notOk(existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
        })
        getViewsArtifacts.forEach(path => {
          if (path.includes('get-')) {
            t.ok(existsSync(path), `Found views file in GET function ${path}`)
          }
          else {
            t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
          }
        })
        viewsArtifactsDisabled.forEach(path => {
          t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] shared() src/views to only @views (unless disabled or folder not found)`, t => {
  t.plan(viewsArtifacts.length + viewsArtifactsDisabled.length + 1)
  resetAndCopyShared(t, function () {
    cp(join('src', 'app.arc-with-views'), join('.', 'app.arc'), { overwrite: true }, function (err) {
      if (err) t.fail(err)
      else {
        hydrate.shared({ symlink }, function (err) {
          if (err) t.fail(err)
          else {
            // Check to see if files that are supposed to be there are actually there
            viewsArtifacts.forEach(path => {
              if (path.includes('get-index') || path.includes('post-up-tents')) {
                t.ok(existsSync(path), `Found views file in GET function ${path}`)
              }
              else {
                t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
              }
            })
            viewsArtifactsDisabled.forEach(path => {
              t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
            })
            checkFolderCreation(t)
          }
        })
      }
    })
  })
})

test(`[Symlinking] shared() copies app.arc file and static.json (Arc <5)`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length + 1)
  process.env.DEPRECATED = true
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        delete process.env.DEPRECATED
        // Check to see if files that are supposed to be there are actually there
        arcFileArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found app.arc file in ${path}`)
        })
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] shared() copies static.json but not app.arc (Arc v6+)`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length + 1)
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        arcFileArtifacts.forEach(path => {
          t.notOk(existsSync(path), `Did not find app.arc file in ${path}`)
        })
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] shared() copies static.json with @static folder configured`, t => {
  t.plan(staticArtifacts.length + 3)
  resetAndCopyShared(t, function () {
    // Rewrite app.arc to include @static folder directive
    let arcFile = join(process.cwd(), 'app.arc')
    let arc = readFileSync(arcFile).toString()
    arc += '@static\nfolder foo'
    writeFileSync(arcFile, arc)
    t.pass(`Added '@static folder foo' to app.arc`)
    // Move public/ to foo/
    renameSync(join(process.cwd(), 'public'), join(process.cwd(), 'foo'))
    t.ok(existsSync(join(process.cwd(), 'foo', 'static.json')), 'public/static.json moved into foo/static.json')
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] shared() should remove files in functions that do not exist in src/shared and src/views`, t => {
  t.plan(sharedArtifacts.length + getViewsArtifacts.length + 1)
  resetAndCopyShared(t, function () {
    let sharedStragglers = sharedArtifacts.map((p) => {
      let dir = dirname(p)
      mkdirSync(dir, { recursive: true })
      let file = join(dir, 'straggler.json')
      writeFileSync(file, '{surprise:true}')
      return file
    })
    let viewsStragglers = getViewsArtifacts.map((p) => {
      let dir = dirname(p)
      mkdirSync(dir, { recursive: true })
      let file = join(dir, 'straggler.json')
      writeFileSync(file, '{surprise:true}')
      return file
    })
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        sharedStragglers.forEach(path => {
          t.notOk(existsSync(path), `shared straggler file removed from ${path}`)
        })
        viewsStragglers.forEach(path => {
          t.notOk(existsSync(path), `views straggler file removed from ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] install with symlink hydrates all Functions', src/shared and src/views dependencies`, t => {
  let count =
    pythonDependencies.length +
    rubyDependencies().length +
    nodeDependencies.length +
    pythonSharedDependencies.length +
    pythonViewsDependencies.length +
    rubySharedDependencies.length +
    rubyViewsDependencies.length +
    nodeSharedDependencies.length +
    nodeViewsDependencies.length + 3
  t.plan(count)
  resetAndCopyShared(t, function () {
    hydrate.install({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        pythonDependencies.forEach(p => {
          t.ok(existsSync(p), `python dependency exists at ${p}`)
        })
        rubyDependencies().forEach(p => {
          t.ok(existsSync(p), `ruby dependency exists at ${p}`)
        })
        nodeDependencies.forEach(p => {
          t.ok(existsSync(p), `node dependency exists at ${p}`)
        })
        pythonSharedDependencies.forEach(p => {
          t.ok(existsSync(p), `python shared dependency exists at ${p}`)
        })
        rubySharedDependencies.forEach(p => {
          t.ok(existsSync(p), `ruby shared dependency exists at ${p}`)
        })
        nodeSharedDependencies.forEach(p => {
          t.ok(existsSync(p), `node shared dependency exists at ${p}`)
        })
        pythonViewsDependencies.forEach(p => {
          t.ok(existsSync(p), `python views dependency exists at ${p}`)
        })
        rubyViewsDependencies.forEach(p => {
          t.ok(existsSync(p), `ruby views dependency exists at ${p}`)
        })
        nodeViewsDependencies.forEach(p => {
          t.ok(existsSync(p), `node views dependency exists at ${p}`)
        })
        // Yarn-specific tests
        let yarnFunction = join(mockTmp, 'src', 'http', 'put-on_your_boots')
        let yarnIntFile = join(yarnFunction, 'node_modules', '.yarn-integrity')
        let pkgLockFile = join(yarnFunction, 'package-lock.json')
        t.ok(existsSync(yarnIntFile), 'Found yarn integrity file')
        t.notOk(existsSync(pkgLockFile), `Did not find package-lock.json (i.e. npm didn't run)`)
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] install (specific path / single path) hydrates only Functions found in the specified subpath`, t => {
  t.plan(8)
  resetAndCopyShared(t, function () {
    let basepath = nodeFunctions[0]
    hydrate.install({ basepath, symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        t.ok(existsSync(nodeDependencies[0]), `scoped install for ${nodeFunctions[0]} installed dependencies in ${nodeDependencies[0]}`)
        t.notOk(existsSync(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcHttp[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcHttp[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcHttp[0]))
        t.ok(existsSync(nodeSharedDependencies[0]), `node shared dependency exists at ${nodeSharedDependencies[0]}`)
        t.ok(existsSync(nodeViewsDependencies[0]), `node views dependency exists at ${nodeViewsDependencies[0]}`)
        t.notOk(existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        t.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        t.ok(existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] install() should not recurse into Functions dependencies and hydrate those`, t => {
  t.plan(2)
  reset(t, function () {
    let subdep = join(nodeFunctions[0], 'node_modules', 'poop')
    mkdirSync(subdep, { recursive: true })
    writeFileSync(join(subdep, 'package.json'), JSON.stringify({
      name: 'poop',
      dependencies: { 'tiny-json-http': '*' }
    }), 'utf-8')
    let basepath = nodeFunctions[0]
    hydrate.install({ basepath, symlink }, function (err) {
      if (err) t.fail(err)
      else {
        let submod = join(subdep, 'node_modules')
        t.notOk(existsSync(submod), `install did not recurse into node subdependencies at ${submod}`)
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Symlinking] update() bumps installed dependencies to newer versions`, t => {
  t.plan(4)
  reset(t, function () {
    // TODO: pip requires manual locking (via two requirements.txt files) so
    // we dont test update w/ python
    hydrate.update({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // eslint-disable-next-line
        let pkgLock = require(join(mockTmp, nodeFunctions[0], 'package-lock.json'))
        let newVersion = pkgLock.lockfileVersion === 2
          ? pkgLock.packages['node_modules/tiny-json-http'].version
          : pkgLock.dependencies['tiny-json-http'].version
        t.notEqual(newVersion, '7.0.2', `get-index tiny-json-http bumped to ${newVersion} from 7.0.2`)

        let yarnLock = readFileSync(join(mockTmp, nodeFunctions[2], 'yarn.lock'), 'utf-8')
        let newYarn = yarnLock.split('\n').filter(t => t.includes('  version "'))[0].split('  version "')[1].replace('"', '')
        t.notEqual(newYarn, '7.0.2', `put-on_your_boots tiny-json-http bumped to ${newVersion} from 7.0.2`)

        let gemfileLock = readFileSync(join(mockTmp, rubyFunctions[0], 'Gemfile.lock'), 'utf-8')
        let newGem = gemfileLock.split('\n').filter(t => t.includes('a (0'))[0].split('(')[1].split(')')[0]
        t.notEqual(newGem, '0.2.1', `delete-badness_in_life 'a' gem bumped to ${newGem} from 0.2.1`)
        checkFolderCreation(t)
      }
    })
  })
})
