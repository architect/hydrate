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

test('sanity check', t => {
  t.plan(1)
  t.ok(hydrate, 'hydrate in scope')
})

test(`Hydrate invokes 'shared' by default`, t => {
  t.plan(2)
  hydrate({}, function done (err) {
    if (err) t.fail(err)
    else {
      t.equal(called.length, 1, 'Invoked one method')
      t.equal(called[0], 'shared', 'Invoked shared')
    }
  })
  reset()
})

test(`Hydrate invokes 'install' if specified via params`, t => {
  t.plan(2)
  hydrate({ install: true }, function done (err) {
    if (err) t.fail(err)
    else {
      t.equal(called.length, 1, 'Invoked one method')
      t.equal(called[0], 'install', 'Invoked shared')
    }
  })
  reset()
})

test(`Hydrate invokes 'update' if specified via params`, t => {
  t.plan(2)
  hydrate({ update: true }, function done (err) {
    if (err) t.fail(err)
    else {
      t.equal(called.length, 1, 'Invoked one method')
      t.equal(called[0], 'update', 'Invoked shared')
    }
  })
  reset()
})
