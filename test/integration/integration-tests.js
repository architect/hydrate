let path = require('path')
let rm = require('rimraf')
let { existsSync: exists, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } = require('fs')
let cp = require('cpr')
let test = require('tape')
let glob = require('glob')
let hydrate = require('../../')
process.env.CI = true // Suppresses tape issues with progress indicator

let mockSource    = path.join(__dirname, 'mock')
let mockTmp       = path.join(__dirname, 'tmp')
let pythonShared  = path.join('vendor', 'shared')
let rubyShared    = path.join('vendor', 'shared')
let nodeShared    = path.join('node_modules', '@architect', 'shared')
let pythonViews   = path.join('vendor', 'views')
let rubyViews     = path.join('vendor', 'views')
let nodeViews     = path.join('node_modules', '@architect', 'views')

// Manual list of mock app resources. If you change the mock app, update these!
let arcHttp = [
  'get-index',
  'post-up-tents',
  'put-on_your_boots',
  'get-memories',
  'delete-badness_in_life'
].map(route => path.join('src', 'http', route))

let arcEvents = [ 'just-being-in-nature' ]
  .map(route => path.join('src', 'events', route))

let arcQueues = [ 'parks-to-visit' ]
  .map(route => path.join('src', 'queues', route))

let arcScheduled = [ 'hikes-with-friends' ]
  .map(route => path.join('src', 'scheduled', route))

let arcTables = [ 'trails-insert' ]
  .map(route => path.join('src', 'tables', route))

/**
 * Functions by runtime
 */
let pythonFunctions = [ path.join('src', 'http', 'get-memories') ]
let rubyFunctions = [ path.join('src', 'http', 'delete-badness_in_life') ]
let nodeFunctions = arcHttp.concat(arcEvents, arcQueues, arcScheduled, arcTables)
  .filter(p => !pythonFunctions.includes(p) && !rubyFunctions.includes(p))

/**
 * Runtime dependencies
 */
let pythonDependencies = pythonFunctions.map(p => path.join(p, 'vendor', 'minimal-0.1.0.dist-info'))
let rubyDependencies = () => rubyFunctions.map(p => glob.sync(`${p}/vendor/bundle/ruby/**/gems/a-0.2.1`)[0])
let nodeDependencies = nodeFunctions.map(p => path.join(p, 'node_modules', 'tiny-json-http'))

/**
 * Runtime shared/views dependencies
 */
let pythonSharedDependencies = pythonFunctions
  .map(p => path.join(p, pythonShared, 'node_modules', 'tiny-json-http'))

let pythonViewsDependencies = pythonFunctions
  .map(p => path.join(p, pythonViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-'))

let rubySharedDependencies = rubyFunctions
  .map(p => path.join(p, rubyShared, 'node_modules', 'tiny-json-http'))

let rubyViewsDependencies = rubyFunctions
  .map(p => path.join(p, rubyViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-'))

let nodeSharedDependencies = nodeFunctions
  .map(p => path.join(p, nodeShared, 'node_modules', 'tiny-json-http'))

let nodeViewsDependencies = nodeFunctions
  .map(p => path.join(p, nodeViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-'))

/**
 * Artifact paths
 */
let arcFileArtifacts = []
  .concat(pythonFunctions.map(p => path.join(p, pythonShared, '.arc')))
  .concat(rubyFunctions.map(p => path.join(p, rubyShared, '.arc')))
  .concat(nodeFunctions.map(p => path.join(p, nodeShared, '.arc')))

let staticArtifacts = arcFileArtifacts
  .map(p => path.join(path.dirname(p), 'static.json'))

let sharedArtifacts = []
  .concat(pythonFunctions.map(p => path.join(p, rubyShared, 'shared.md')))
  .concat(rubyFunctions.map(p => path.join(p, rubyShared, 'shared.md')))
  .concat(nodeFunctions.map(p => path.join(p, nodeShared, 'shared.md')))

// Represents src/views without @views pragma (i.e. all GET fns receive views)
let getViewsArtifacts = []
  .concat(pythonFunctions.map(p => path.join(p, pythonViews, 'views.md')))
  .concat(rubyFunctions.map(p => path.join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => path.join(p, nodeViews, 'views.md')))
  .filter(p => p.includes('get-'))

// Represents @views pragma
let viewsArtifacts = []
  .concat(pythonFunctions.map(p => path.join(p, pythonViews, 'views.md')))
  .concat(rubyFunctions.map(p => path.join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => path.join(p, nodeViews, 'views.md')))

function reset (callback) {
  process.chdir(__dirname)
  rm(mockTmp, { glob: false, maxBusyTries: 30 }, function (err) {
    if (err) callback(err)
    else {
      cp(mockSource, mockTmp, { overwrite: true }, function (err) {
        if (err) callback(err)
        else {
          process.chdir(mockTmp)
          callback()
        }
      })
    }
  })
}

test(`shared() copies src/shared and src/views to all (@views not specified)`, t => {
  t.plan(sharedArtifacts.length + getViewsArtifacts.length)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          hydrate.shared({}, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              // Check to see if files that are supposed to be there are actually there
              sharedArtifacts.forEach(path => {
                t.ok(exists(path), `Found shared file in ${path}`)
              })
              getViewsArtifacts.forEach(path => {
                if (path.includes('get-')) {
                  t.ok(exists(path), `Found views file in GET function ${path}`)
                }
                else {
                  t.notOk(exists(path), `Did not find views file in non-GET function ${path}`)
                }
              })
            }
          })
        }
      })
    }
  })
})

test(`shared() src/views to only @views`, t => {
  t.plan(viewsArtifacts.length)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          cp(path.join('src', '.arc-with-views'), path.join('.', '.arc'), { overwrite: true }, function done (err) {
            if (err) t.fail(err)
            else {
              hydrate.shared({}, function done (err) {
                if (err) t.fail(err)
                else {
                  console.log(`noop log to help reset tap-spec lol`)
                  // Check to see if files that are supposed to be there are actually there
                  viewsArtifacts.forEach(path => {
                    if (path.includes('get-index') || path.includes('post-up-tents')) {
                      t.ok(exists(path), `Found views file in GET function ${path}`)
                    }
                    else {
                      t.notOk(exists(path), `Did not find views file in non-GET function ${path}`)
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
})

test(`shared() copies .arc file and static.json (Arc <5)`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length)
  process.env.DEPRECATED = true
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          hydrate.shared({}, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              delete process.env.DEPRECATED
              // Check to see if files that are supposed to be there are actually there
              arcFileArtifacts.forEach(path => {
                t.ok(exists(path), `Found .arc file in ${path}`)
              })
              staticArtifacts.forEach(path => {
                t.ok(exists(path), `Found static.json file in ${path}`)
              })
            }
          })
        }
      })
    }
  })
})

test(`shared() copies static.json but not .arc (Arc v6+)`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          hydrate.shared({}, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              // Check to see if files that are supposed to be there are actually there
              arcFileArtifacts.forEach(path => {
                t.notOk(exists(path), `Did not find .arc file in ${path}`)
              })
              staticArtifacts.forEach(path => {
                t.ok(exists(path), `Found static.json file in ${path}`)
              })
            }
          })
        }
      })
    }
  })
})

test(`shared() copies static.json with @static folder configured`, t => {
  t.plan(staticArtifacts.length + 2)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      // Rewrite .arc to include @static folder directive
      let arcFile = path.join(process.cwd(), '.arc')
      let arc = readFileSync(arcFile).toString()
      arc += '@static\nfolder foo'
      writeFileSync(arcFile, arc)
      t.pass(`Added '@static folder foo' to .arc`)
      // Move public/ to foo/
      renameSync(path.join(process.cwd(), 'public'), path.join(process.cwd(), 'foo'))
      t.ok(exists(path.join(process.cwd(), 'foo', 'static.json')), 'public/static.json moved into foo/static.json')
      hydrate.shared({}, function done (err) {
        if (err) t.fail(err)
        else {
          console.log(`noop log to help reset tap-spec lol`)
          // Check to see if files that are supposed to be there are actually there
          staticArtifacts.forEach(path => {
            t.ok(exists(path), `Found static.json file in ${path}`)
          })
        }
      })
    }
  })
})

test(`shared() should remove files in functions that do not exist in src/shared and src/views`, t => {
  t.plan(sharedArtifacts.length + getViewsArtifacts.length)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      let sharedStragglers = sharedArtifacts.map((p) => {
        let dir = path.dirname(p)
        mkdirSync(dir, { recursive: true })
        let file = path.join(dir, 'straggler.json')
        writeFileSync(file, '{surprise:true}')
        return file
      })
      let viewsStragglers = getViewsArtifacts.map((p) => {
        let dir = path.dirname(p)
        mkdirSync(dir, { recursive: true })
        let file = path.join(dir, 'straggler.json')
        writeFileSync(file, '{surprise:true}')
        return file
      })
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          hydrate.shared({}, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              // Check to see if files that are supposed to be there are actually there
              sharedStragglers.forEach(path => {
                t.notOk(exists(path), `shared straggler file removed from ${path}`)
              })
              viewsStragglers.forEach(path => {
                t.notOk(exists(path), `views straggler file removed from ${path}`)
              })
            }
          })
        }
      })
    }
  })
})

test(`shared() never uses symlinks by default`, t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          hydrate.shared({}, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              let stat = lstatSync('src/http/get-index/node_modules/@architect/shared').isSymbolicLink()
              t.notOk(stat, 'shared directory was copied, and is not a symlink')
            }
          })
        }
      })
    }
  })
})

test(`shared() maybe uses symlinks in sandbox mode`, t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          let isWin = process.platform === 'win32'
          hydrate.shared({ sandbox: true }, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              let stat = lstatSync('src/http/get-index/node_modules/@architect/shared').isSymbolicLink()
              // TODO ↓ remove me! ↓
              console.log(`stat:`, stat, process.env.CI_OS)
              if (isWin) {
                t.notOk(stat, 'shared directory was copied, and is not a symlink')
              }
              else {
                t.ok(stat, 'shared directory is a symlink')
              }
            }
          })
        }
      })
    }
  })
})

test(`install(undefined) hydrates all Functions', src/shared and src/views dependencies`, t => {
  let count =
    pythonDependencies.length +
    rubyDependencies().length +
    nodeDependencies.length +
    pythonSharedDependencies.length +
    pythonViewsDependencies.length +
    rubySharedDependencies.length +
    rubyViewsDependencies.length +
    nodeSharedDependencies.length +
    nodeViewsDependencies.length + 2
  t.plan(count)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          hydrate.install(undefined, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              pythonDependencies.forEach(p => {
                t.ok(exists(p), `python dependency exists at ${p}`)
              })
              rubyDependencies().forEach(p => {
                t.ok(exists(p), `ruby dependency exists at ${p}`)
              })
              nodeDependencies.forEach(p => {
                t.ok(exists(p), `node dependency exists at ${p}`)
              })
              pythonSharedDependencies.forEach(p => {
                t.ok(exists(p), `python shared dependency exists at ${p}`)
              })
              rubySharedDependencies.forEach(p => {
                t.ok(exists(p), `ruby shared dependency exists at ${p}`)
              })
              nodeSharedDependencies.forEach(p => {
                t.ok(exists(p), `node shared dependency exists at ${p}`)
              })
              pythonViewsDependencies.forEach(p => {
                t.ok(exists(p), `python views dependency exists at ${p}`)
              })
              rubyViewsDependencies.forEach(p => {
                t.ok(exists(p), `ruby views dependency exists at ${p}`)
              })
              nodeViewsDependencies.forEach(p => {
                t.ok(exists(p), `node views dependency exists at ${p}`)
              })
              // Yarn-specific tests
              let yarnFunction = path.join(mockTmp, 'src', 'http', 'put-on_your_boots')
              let yarnIntFile = path.join(yarnFunction, 'node_modules', '.yarn-integrity')
              let pkgLockFile = path.join(yarnFunction, 'package-lock.json')
              t.ok(exists(yarnIntFile), 'Found yarn integrity file')
              t.notOk(exists(pkgLockFile), `Did not find package-lock.json (i.e. npm didn't run)`)
            }
          })
        }
      })
    }
  })
})

test(`install (specific path / single path) hydrates only Functions found in the specified subpath`, t => {
  t.plan(7)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', { overwrite: true }, function done (err) {
        if (err) t.fail(err)
        else {
          let basepath = nodeFunctions[0]
          hydrate.install({ basepath }, function done (err) {
            if (err) t.fail(err)
            else {
              console.log(`noop log to help reset tap-spec lol`)
              // Check to see if files that are supposed to be there are actually there
              t.ok(exists(nodeDependencies[0]), `scoped install for ${nodeFunctions[0]} installed dependencies in ${nodeDependencies[0]}`)
              t.notOk(exists(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
              let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcHttp[0]))
              let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcHttp[0]))
              let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcHttp[0]))
              t.ok(exists(nodeSharedDependencies[0]), `node shared dependency exists at ${nodeSharedDependencies[0]}`)
              t.ok(exists(nodeViewsDependencies[0]), `node views dependency exists at ${nodeViewsDependencies[0]}`)
              t.notOk(exists(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
              t.ok(exists(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
              t.ok(exists(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
            }
          })
        }
      })
    }
  })
})

test(`install() should not recurse into Functions dependencies and hydrate those`, t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      let subdep = path.join(nodeFunctions[0], 'node_modules', 'poop')
      mkdirSync(subdep, { recursive: true })
      writeFileSync(path.join(subdep, 'package.json'), JSON.stringify({
        name: 'poop',
        dependencies: { 'tiny-json-http': '*' }
      }), 'utf-8')
      let basepath = nodeFunctions[0]
      hydrate.install({ basepath }, function done (err) {
        if (err) t.fail(err)
        else {
          console.log(`noop log to help reset tap-spec lol`)
          let submod = path.join(subdep, 'node_modules')
          t.notOk(exists(), `install did not recurse into node subdependencies at ${submod}`)
        }
      })
    }
  })
})

test(`update() bumps installed dependencies to newer versions`, t => {
  t.plan(3)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      // TODO: pip requires manual locking (via two requirements.txt files) so
      // we dont test update w/ python
      hydrate.update(undefined, function done (err) {
        if (err) t.fail(err)
        else {
          console.log(`noop log to help reset tap-spec lol`)
          // eslint-disable-next-line
          let pkgLock = require(path.join(mockTmp, nodeFunctions[0], 'package-lock.json'))
          let newVersion = pkgLock.dependencies['tiny-json-http'].version
          t.notEqual(newVersion, '7.0.2', `get-index tiny-json-http bumped to ${newVersion} from 7.0.2`)

          let yarnLock = readFileSync(path.join(mockTmp, nodeFunctions[2], 'yarn.lock'), 'utf-8')
          let newYarn = yarnLock.split('\n').filter(t => t.includes('  version "'))[0].split('  version "')[1].replace('"', '')
          t.notEqual(newYarn, '7.0.2', `put-on_your_boots tiny-json-http bumped to ${newVersion} from 7.0.2`)

          let gemfileLock = readFileSync(path.join(mockTmp, rubyFunctions[0], 'Gemfile.lock'), 'utf-8')
          let newGem = gemfileLock.split('\n').filter(t => t.includes('a (0'))[0].split('(')[1].split(')')[0]
          t.notEqual(newGem, '0.2.1', `delete-badness_in_life 'a' gem bumped to ${newGem} from 0.2.1`)
        }
      })
    }
  })
})

test('Corrupt package-lock.json fails hydrate.install', t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      // Make missing the package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(path.join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
      let basepath = nodeFunctions[0]
      hydrate.install({ basepath }, function done (err) {
        console.log(`noop log to help reset tap-spec lol`)
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt package-lock.json fails hydrate.update', t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      // Make missing the package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(path.join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
      hydrate.update(nodeFunctions[0], function done (err) {
        console.log(`noop log to help reset tap-spec lol`)
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt Gemfile fails hydrate.install', t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      unlinkSync(path.join(rubyFunctions[0], 'Gemfile.lock'))
      writeFileSync(path.join(rubyFunctions[0], 'Gemfile'), corruptPackage)
      let basepath = rubyFunctions[0]
      hydrate.install({ basepath }, function done (err) {
        console.log(`noop log to help reset tap-spec lol`)
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt Gemfile fails hydrate.update', t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      unlinkSync(path.join(rubyFunctions[0], 'Gemfile.lock'))
      writeFileSync(path.join(rubyFunctions[0], 'Gemfile'), corruptPackage)
      let basepath = rubyFunctions[0]
      hydrate.update({ basepath }, function done (err) {
        console.log(`noop log to help reset tap-spec lol`)
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt requirements.txt fails hydrate.install', t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(path.join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
      let basepath = pythonFunctions[0]
      hydrate.install({ basepath }, function done (err) {
        console.log(`noop log to help reset tap-spec lol`)
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt requirements.txt fails hydrate.update', t => {
  t.plan(1)
  reset(function (err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(path.join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
      hydrate.update(pythonFunctions[0], function done (err) {
        console.log(`noop log to help reset tap-spec lol`)
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})
