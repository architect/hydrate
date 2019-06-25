let path = require('path')
let rm = require('rimraf')
let fs = require('fs')
let exists = fs.existsSync
let cp = require('cpr')
let mkdirp = require('mkdirp')
let test = require('tape')
let glob = require('glob')
let hydrate = require('../')

let mockSource = path.join(__dirname, 'mock')
let mockTmp = path.join(__dirname, 'tmp')
let pythonShared = path.join('vendor', 'architect-functions', 'shared')
let rubyShared = path.join('vendor', 'bundle', 'architect-functions', 'shared')
let nodeShared = path.join('node_modules', '@architect', 'shared')
let pythonViews = path.join('vendor', 'architect-functions', 'views')
let rubyViews = path.join('vendor', 'bundle', 'architect-functions', 'views')
let nodeViews = path.join('node_modules', '@architect', 'views')

// Manual list of mock app resources. If you change the mock app, update these!
let arcHttp = ['get-index', 'post-up-tents', 'put-on_your_boots', 'get-memories', 'delete-badness_in_life'].map(route => path.join('src', 'http', route))
let arcEvents = ['just-being-in-nature'].map(route => path.join('src', 'events', route))
let arcQueues = ['parks-to-visit'].map(route => path.join('src', 'queues', route))
let arcScheduled = ['hikes-with-friends'].map(route => path.join('src', 'scheduled', route))
let arcTables = ['trails-insert'].map(route => path.join('src', 'tables', route))
let pythonFunctions = [path.join('src', 'http', 'get-memories')]
let rubyFunctions = [path.join('src', 'http', 'delete-badness_in_life')]
let nodeFunctions = arcHttp.concat(arcEvents, arcQueues, arcScheduled, arcTables).filter(p => !pythonFunctions.includes(p) && !rubyFunctions.includes(p))
let pythonDependencies = pythonFunctions.map(p => path.join(p, 'vendor', 'minimal-0.1.0.dist-info'))
let rubyDependencies = function () {
  return rubyFunctions.map(p => glob.sync(`${p}/vendor/bundle/ruby/**/gems/a-0.2.1`)[0])
}
let nodeDependencies = nodeFunctions.map(p => path.join(p, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-'))
let arcFileArtifacts = pythonFunctions.map(p => path.join(p, pythonShared, '.arc'))
  .concat(rubyFunctions.map(p => path.join(p, rubyShared, '.arc')))
  .concat(nodeFunctions.map(p => path.join(p, nodeShared, '.arc')))
let staticArtifacts = arcFileArtifacts.map(p => path.join(path.dirname(p), 'static.json'))
let sharedArtifacts = pythonFunctions.map(p => path.join(p, pythonShared, 'shared.md'))
  .concat(rubyFunctions.map(p => path.join(p, rubyShared, 'shared.md')))
  .concat(nodeFunctions.map(p => path.join(p, nodeShared, 'shared.md')))
let viewsArtifacts = pythonFunctions.map(p => path.join(p, pythonViews, 'views.md'))
  .concat(rubyFunctions.map(p => path.join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => path.join(p, nodeViews, 'views.md')))
  .filter(p => p.includes('get-'))

function reset(callback) {
  process.chdir(__dirname)
  rm(mockTmp, {glob: false, maxBusyTries: 30}, function(err) {
    if (err) callback(err)
    else {
      cp(mockSource, mockTmp, {overwrite:true}, function(err) {
        if (err) callback(err)
        else {
          process.chdir(mockTmp)
          callback()
        }
      })
    }
  })
}

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

test(`shared() copies .arc file and static.json`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      hydrate.shared(function done(err) {
        if (err) t.fail(err)
        else {
          // Check to see if files that are supposed to be there are actually there
          arcFileArtifacts.forEach(path => {
            t.ok(exists(path), `Found .arc file in ${path}`);
          })
          staticArtifacts.forEach(path => {
            t.ok(exists(path), `Found static.json file in ${path}`);
          })
        }
      })
    }
  })
})

test(`shared() should remove files in functions that do not exist in src/shared and src/views`, t=> {
  t.plan(sharedArtifacts.length + viewsArtifacts.length)
  reset(function(err) {
    if (err) t.fail(err)
    else {
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

test(`install(undefined) installs manifest dependencies in all Functions as well as src/shared and src/views`, t=> {
  t.plan(pythonDependencies.length + rubyDependencies().length + nodeDependencies.length + 2)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', {overwrite: true}, function done(err) {
        if (err) t.fail(err)
        else {
          hydrate.install(undefined, function done(err) {
            if (err) t.fail(err)
            else {
              pythonDependencies.forEach(p => {
                t.ok(exists(p), `python dependency exists at ${p}`)
              })
              rubyDependencies().forEach(p => {
                t.ok(exists(p), `ruby dependency exists at ${p}`)
              })
              nodeDependencies.forEach(p => {
                t.ok(exists(p), `node dependency exists at ${p}`)
              })
              let sharedDep = path.join('src', 'shared', 'node_modules', 'tiny-json-http')
              let viewsDep = path.join('src', 'views', 'node_modules', 'tiny-json-http')
              t.ok(exists(sharedDep), `${sharedDep} exists`)
              t.ok(exists(viewsDep), `${viewsDep} exists`)
            }
          })
        }
      })
    }
  })
})

test(`install(specific-path) hydrates only Functions found in the specified subpath`, t=> {
  t.plan(2)
  reset(function(err) {
    if (err) t.fail(err)
    else {
      let index = nodeFunctions[0]
      hydrate.install(index, function done(err) {
        if (err) t.fail(err)
        else {
          // Check to see if files that are supposed to be there are actually there
          t.ok(exists(nodeDependencies[0]), `scoped install for ${nodeFunctions[0]} installed dependencies in ${nodeDependencies[0]}`)
          t.notOk(exists(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
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
      let subdep = path.join(nodeFunctions[0], 'node_modules', 'poop')
      mkdirp.sync(subdep)
      fs.writeFileSync(path.join(subdep, 'package.json'), JSON.stringify({
        name: 'poop',
        dependencies: { 'tiny-json-http': '*' }
      }), 'utf-8')
      hydrate.install(nodeFunctions[0], function done(err) {
        if (err) t.fail(err)
        else {
          let submod = path.join(subdep, 'node_modules')
          t.notOk(exists(), `install did not recurse into node subdependencies at ${submod}`)
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
          let lock = require(path.join(mockTmp, nodeFunctions[0], 'package-lock.json'))
          let newVersion = lock.dependencies['tiny-json-http'].version
          t.notEqual(newVersion, '7.0.2', `get-index tiny-json-http bumped to ${newVersion} from 7.0.2`)
          let gemfileLock = fs.readFileSync(path.join(mockTmp, rubyFunctions[0], 'Gemfile.lock'), 'utf-8')
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
      fs.writeFileSync(path.join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
      hydrate.install(nodeFunctions[0], function done(err) {
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
      fs.writeFileSync(path.join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
      hydrate.update(nodeFunctions[0], function done(err) {
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
      fs.unlinkSync(path.join(rubyFunctions[0], 'Gemfile.lock'))
      fs.writeFileSync(path.join(rubyFunctions[0], 'Gemfile'), corruptPackage)
      hydrate.install(rubyFunctions[0], function done(err) {
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
      fs.unlinkSync(path.join(rubyFunctions[0], 'Gemfile.lock'))
      fs.writeFileSync(path.join(rubyFunctions[0], 'Gemfile'), corruptPackage)
      hydrate.update(rubyFunctions[0], function done(err) {
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
      fs.writeFileSync(path.join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
      hydrate.install(pythonFunctions[0], function done(err) {
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
      fs.writeFileSync(path.join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
      hydrate.update(pythonFunctions[0], function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})
