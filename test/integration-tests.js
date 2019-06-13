let path = require('path')
let rm = require('rimraf')
let glob = require('glob')
let fs = require('fs')
let exists = fs.existsSync
let cp = require('cpr')
let test = require('tape')
let hydrate = require('../')
let utils = require('@architect/utils')

let mockSource = path.join(__dirname, 'mock')
let mockTmp = path.join(__dirname, 'tmp')
let arcFileArtifacts, sharedArtifacts, viewsArtifacts, inventory

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
      inventory = utils.inventory()
      // The path weirdness below is due to figuring out which runtime is which
      // currently just basing it on the mock app's route names
      // would be nice if arc/utils.inventory could help figure this out
      arcFileArtifacts = inventory.localPaths.map((p) => {
        if (p.includes('memories')) return path.join(p, 'vendor', 'architect-functions', 'shared', '.arc')
        else if (p.includes('badness')) return path.join(p, 'vendor', 'bundle', 'architect-functions', 'shared', '.arc')
        return path.join(p, 'node_modules', '@architect', 'shared', '.arc')
      })
      sharedArtifacts = inventory.localPaths.map((p) => {
        if (p.includes('memories')) return path.join(p, 'vendor', 'architect-functions', 'shared', 'shared.md')
        else if (p.includes('badness')) return path.join(p, 'vendor', 'bundle', 'architect-functions', 'shared', 'shared.md')
        return path.join(p, 'node_modules', '@architect', 'shared', 'shared.md')
      }).filter(p => p.includes('http'))
      viewsArtifacts = inventory.localPaths.map((p) => {
        if (p.includes('memories')) return path.join(p, 'vendor', 'architect-functions', 'views', 'views.md')
        else if (p.includes('badness')) return path.join(p, 'vendor', 'bundle', 'architect-functions', 'views', 'views.md')
        return path.join(p, 'node_modules', '@architect', 'views', 'views.md')
      }).filter(p => p.includes('http'))
      t.ok(true, 'inventory populated')
      t.end()
    }
  })
})

// Figure out where expected dependencies exist at runtime, since runtime
// versions may be variable (e.g. CI or random contributor machine)
function discoverFunctionDependencies () {
  return inventory.localPaths.map((p) => {
    if (p.includes('memories')) {
      return path.join(p, 'vendor', 'minimal-0.1.0.dist-info')
    } else if (p.includes('badness')) {
      // Need to glob here since the path to dependencies are based on the ruby version you have installed 🤪
      let subpath = path.join(p, 'vendor', 'bundle', 'ruby', '**', 'gems', 'a-0.2.1')
      let rubyglob = glob.sync(subpath)
      return rubyglob[0]
    }
    return path.join(p, 'node_modules', 'tiny-json-http')
  })
}

test('parameterless hydrate() runs to completion on mock app', t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
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
  reset(function(err) {
    if (err) t.fail(err)
    else {
      cp('_optional', 'src', {overwrite: true}, function done(err) {
        if (err) t.fail(err)
        else {
          t.plan(inventory.localPaths.filter(p => p.includes('http')).length * 2)
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

test(`install() hydrates all Functions' dependencies`, t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(inventory.localPaths.length * 2)
      hydrate.install(function done(err) {
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

test(`update() bumps installed dependencies to newer versions`, t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(2)
      // TODO: pip requires manual locking (via two requirements.txt files) so
      // we dont test update w/ python
      hydrate.update(function done(err) {
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
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
      // Make missing the package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-index', 'package-lock.json'), corruptPackage)
      hydrate.install(function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt package-lock.json fails hydrate.update', t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
      // Make missing the package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-index', 'package-lock.json'), corruptPackage)
      hydrate.update(function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt Gemfile fails hydrate.install', t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
      let corruptPackage = 'ohayo gozaimasu!'
      fs.unlinkSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile.lock'))
      fs.writeFileSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile'), corruptPackage)
      hydrate.install(function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt Gemfile fails hydrate.update', t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
      let corruptPackage = 'ohayo gozaimasu!'
      fs.unlinkSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile.lock'))
      fs.writeFileSync(path.join('src', 'http', 'delete-badness_in_life', 'Gemfile'), corruptPackage)
      hydrate.update(function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt requirements.txt fails hydrate.install', t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-memories', 'requirements.txt'), corruptPackage)
      hydrate.install(function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})

test('Corrupt requirements.txt fails hydrate.update', t=> {
  reset(function(err) {
    if (err) t.fail(err)
    else {
      t.plan(1)
      let corruptPackage = 'ohayo gozaimasu!'
      fs.writeFileSync(path.join('src', 'http', 'get-memories', 'requirements.txt'), corruptPackage)
      hydrate.update(function done(err) {
        if (err) t.ok(true, `Successfully exited 1 with ${err}...`)
        else t.fail('Hydration did not fail')
      })
    }
  })
})
