let path = require('path')
let rm = require('rimraf')
let glob = require('glob')
let fs = require('fs')
let exists = fs.existsSync
let cp = require('cpr')
let mkdirp = require('mkdirp')
let test = require('tape')
let hydrate = require('../')
let utils = require('@architect/utils')

let mockSource = path.join(__dirname, 'mock')
let mockTmp = path.join(__dirname, 'tmp')
let arcFileArtifacts, sharedArtifacts, viewsArtifacts
let pythonShared = path.join('vendor', 'architect-functions', 'shared')
let rubyShared = path.join('vendor', 'bundle', 'architect-functions', 'shared')
let nodeShared = path.join('node_modules', '@architect', 'shared')
let pythonViews = path.join('vendor', 'architect-functions', 'views')
let rubyViews = path.join('vendor', 'bundle', 'architect-functions', 'views')
let nodeViews = path.join('node_modules', '@architect', 'views')

function reset(callback) {
  rm.sync(mockTmp)
  cp(mockSource, mockTmp, {overwrite:true}, function(err) {
    if (err) callback(err)
    else {
      process.chdir(mockTmp)
      callback()
    }
  })
}

test('Load project and paths', t => {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      // Figure out where files we expect to be based on runtime
      let pythonFunctions = glob.sync(path.join('src', '**', 'requirements.txt'))
      let rubyFunctions = glob.sync(path.join('src', '**', 'Gemfile')).filter(p => !p.includes(path.join('vendor', 'bundle')))
      let nodeFunctions = glob.sync(path.join('src', '**', 'package.json')).filter(p => !p.includes('node_modules'))
      arcFileArtifacts = pythonFunctions.map(p => path.join(path.dirname(p), pythonShared, '.arc'))
        .concat(rubyFunctions.map(p => path.join(path.dirname(p), rubyShared, '.arc')))
        .concat(nodeFunctions.map(p => path.join(path.dirname(p), nodeShared, '.arc')))
      sharedArtifacts = pythonFunctions.map(p => path.join(path.dirname(p), pythonShared, 'shared.md'))
        .concat(rubyFunctions.map(p => path.join(path.dirname(p), rubyShared, 'shared.md')))
        .concat(nodeFunctions.map(p => path.join(path.dirname(p), nodeShared, 'shared.md'))).filter(p => p.includes('http'))
      viewsArtifacts = pythonFunctions.map(p => path.join(path.dirname(p), pythonViews, 'views.md'))
        .concat(rubyFunctions.map(p => path.join(path.dirname(p), rubyViews, 'views.md')))
        .concat(nodeFunctions.map(p => path.join(path.dirname(p), nodeViews, 'views.md'))).filter(p => p.includes('http') && p.includes('get-'))
      t.ok(true, 'inventory populated')
      t.end()
    }
  })
})

// Figure out where expected dependencies exist at runtime, since runtime
// versions may be variable (e.g. CI or random contributor machine)
function discoverFunctionDependencies () {
  let pythonDeps = glob.sync(path.join('src', '**', 'requirements.txt')).map(p => path.join(path.dirname(p), 'vendor', 'minimal-0.1.0.dist-info'))
  let rubyDeps = glob.sync(path.join('src', '**', 'Gemfile')).filter(p => !p.includes(path.join('vendor', 'bundle'))).map(function(p) {
    let base = path.dirname(p)
    // Need to glob here since the path to dependencies are based on the ruby version you have installed 🤪
    let subpath = path.join(base, 'vendor', 'bundle', 'ruby', '**', 'gems', 'a-0.2.1')
    let rubyglob = glob.sync(subpath)
    return rubyglob[0]
  })
  let nodeDeps = glob.sync(path.join('src', '**', 'package.json')).filter(p => !p.includes('node_modules')).map(p => path.join(path.dirname(p), 'node_modules', 'tiny-json-http'))
  return pythonDeps.concat(rubyDeps).concat(nodeDeps)
}

test('parameterless hydrate() runs to completion on mock app', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      hydrate({}, function done(err) {
        if (err) t.fail(err)
        else {
          t.ok(true, 'clean run to completion')
        }
      })
    }
  })
})

test(`shared() copies src/shared and src/views`, t=> {
  t.plan(sharedArtifacts.length + viewsArtifacts.length)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', {overwrite: true}, function done(err) {
        if (err) t.fail(err)
        else {
          hydrate.shared(function done(err) {
            if (err) t.fail(err)
            else {
              // Check to see if files that are supposed to be there are actually there
              sharedArtifacts.forEach(path => {
                t.ok(exists(path), `Found shared file in ${path}`)
              })
              viewsArtifacts.forEach(path => {
                if (path.includes('get-')) {
                  t.ok(exists(path), `Found views file in GET function ${path}`)
                } else {
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

test(`shared() should remove files in functions that do not exist in src/shared and src/views`, t=> {
  let sharedStragglers = sharedArtifacts.map((p) => {
    let dir = path.dirname(p)
    mkdirp.sync(dir)
    let file = path.join(dir, 'straggler.json')
    fs.writeFileSync(file, '{surprise:true}')
    return file
  })
  let viewsStragglers = viewsArtifacts.map((p) => {
    let dir = path.dirname(p)
    mkdirp.sync(dir)
    let file = path.join(dir, 'straggler.json')
    fs.writeFileSync(file, '{surprise:true}')
    return file
  })
  t.plan(sharedStragglers.length + viewsStragglers.length)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', {overwrite: true}, function done(err) {
        if (err) t.fail(err)
        else {
          hydrate.shared(function done(err) {
            if (err) t.fail(err)
            else {
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

test(`install() hydrates all Functions' dependencies`, t=> {
  t.plan(utils.inventory().localPaths.length * 2)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      hydrate.install(undefined, function done(err) {
        if (err) t.fail(err)
        else {
          // Check to see if files that are supposed to be there are actually there
          discoverFunctionDependencies().forEach(path => {
            t.ok(exists(path), `Found expected dependency in ${path}`);
          })
          arcFileArtifacts.forEach(path => {
            t.ok(exists(path), `Found .arc file in ${path}`);
          })
        }
      })
    }
  })
})

test(`install() hydrates only specified Functions' dependencies`, t=> {
  t.plan(2)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let index = path.join('src', 'http', 'get-index')
      let memories = path.join('src', 'http', 'get-memories', 'vendor', 'minimal-0.1.0.dist-info')
      hydrate.install(index, function done(err) {
        if (err) t.fail(err)
        else {
          // Check to see if files that are supposed to be there are actually there
          t.ok(exists(path.join(index, 'node_modules', 'tiny-json-http')), 'scoped install only installs dependencies for correct function')
          t.notOk(exists(memories), 'scoped install did not install dependencies for unspecified function')
        }
      })
    }
  })
})

test(`install() should not recurse into Functions dependencies and hydrate those`, t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let subdep = path.join('src', 'http', 'get-index', 'node_modules', 'poop')
      mkdirp.sync(subdep)
      fs.writeFileSync(path.join(subdep, 'package.json'), JSON.stringify({
        name: 'poop',
        dependencies: { 'tiny-json-http': '*' }
      }), 'utf-8')
      hydrate.install(undefined, function done(err) {
        if (err) t.fail(err)
        else {
          t.notOk(exists(path.join(subdep, 'node_modules')), '`install` did not recurse into node subdependencies')
        }
      })
    }
  })
})

test(`update() bumps installed dependencies to newer versions`, t=> {
  t.plan(2)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      // TODO: pip requires manual locking (via two requirements.txt files) so
      // we dont test update w/ python
      hydrate.update(undefined, function done(err) {
        if (err) t.fail(err)
        else {
          // eslint-disable-next-line
          let lock = require(path.join(mockTmp, 'src', 'http', 'get-index', 'package-lock.json'))
          let newVersion = lock.dependencies['tiny-json-http'].version
          t.notEqual(newVersion, '7.0.2', `get-index tiny-json-http bumped to ${newVersion} from 7.0.2`)
          let gemfileLock = fs.readFileSync(path.join(mockTmp, 'src', 'http', 'delete-badness_in_life', 'Gemfile.lock'), 'utf-8')
          let newGem = gemfileLock.split('\n').filter(t=>t.includes('a (0'))[0].split('(')[1].split(')')[0]
          t.notEqual(newGem, '0.2.1', `delete-badness_in_life 'a' gem bumped to ${newGem} from 0.2.1`)
        }
      })
    }
  })
})

test('Corrupt package-lock.json fails hydrate.install', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      // Make missing the package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-index', 'package-lock.json'), corruptPackage)
      hydrate.install(undefined, function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt package-lock.json fails hydrate.update', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      // Make missing the package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-index', 'package-lock.json'), corruptPackage)
      hydrate.update(undefined, function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt Gemfile fails hydrate.install', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      fs.unlinkSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile.lock'))
      fs.writeFileSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile'), corruptPackage)
      hydrate.install(undefined, function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt Gemfile fails hydrate.update', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      fs.unlinkSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile.lock'))
      fs.writeFileSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile'), corruptPackage)
      hydrate.update(undefined, function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt requirements.txt fails hydrate.install', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-memories', 'requirements.txt'), corruptPackage)
      hydrate.install(undefined, function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt requirements.txt fails hydrate.update', t=> {
  t.plan(1)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-memories', 'requirements.txt'), corruptPackage)
      hydrate.update(undefined, function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})
