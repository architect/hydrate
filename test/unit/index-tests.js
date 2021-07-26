let test = require('tape')
let proxyquire = require('proxyquire')
let called = []
function caller (type, callback) {
  called.push(type)
  callback()
}
let run = {
  install: (p, callback) => caller('install', callback),
  update: (p, callback) => caller('update', callback),
}
let shared = (p, callback) => caller('shared', callback)
let hydrate = proxyquire('../../', {
  './src': run,
  './src/shared': shared,
})
process.env.CI = true // Suppresses tape issues with progress indicator

function reset () {
  called = []
}

test('Set up env', t => {
  t.plan(1)
  t.ok(hydrate, 'Hydrate module is present')
})

test('Main hydration methods are present', t => {
  t.plan(3)
  t.ok(hydrate.install, 'install method is present')
  t.ok(hydrate.update, 'update method is present')
  t.ok(hydrate.shared, 'shared method is present')
})

test(`hydrate.install invokes install`, t => {
  t.plan(2)
  hydrate.install({}, function done (err) {
    if (err) t.fail(err)
    else {
      t.equal(called.length, 1, 'Invoked one method')
      t.equal(called[0], 'install', 'Invoked install')
    }
  })
  reset()
})

test(`hydrate.update invokes update`, t => {
  t.plan(2)
  hydrate.update({}, function done (err) {
    if (err) t.fail(err)
    else {
      t.equal(called.length, 1, 'Invoked one method')
      t.equal(called[0], 'update', 'Invoked update')
    }
  })
  reset()
})

test(`hydrate.shared invokes shared`, t => {
  t.plan(2)
  hydrate.shared({}, function done (err) {
    if (err) t.fail(err)
    else {
      t.equal(called.length, 1, 'Invoked one method')
      t.equal(called[0], 'shared', 'Invoked shared')
    }
  })
  reset()
})
