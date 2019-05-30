let path = require('path')
let rm = require('rimraf')
let test = require('tape')
let hydrate = require('../')

test('env', t=> {
  t.plan(1)
  t.ok(hydrate, 'hydrate in scope')
})

test('clean', t=> {
  t.plan(1)
  let getBar = path.join(__dirname, 'mock', 'src', 'http', 'get-bar', 'vendor')
  let getFoo = path.join(__dirname, 'mock', 'src', 'http', 'get-foo', 'vendor')
  let getIndex = path.join(__dirname, 'mock', 'src', 'http', 'get-index', 'node_modules')
  rm.sync(getBar)
  rm.sync(getFoo)
  rm.sync(getIndex)
  t.ok(true, 'cleaned')
})

test('hydrate', t=> {
  t.plan(1)
  process.chdir(path.join(__dirname, 'mock'))
  hydrate({install: false}, function done(err, result) {
    if (err) t.fail(err)
    else {
      t.ok(true, 'clean run to completion')
      console.log(result)
    }
  })
})
