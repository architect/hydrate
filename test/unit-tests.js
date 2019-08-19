let test = require('tape')
let sinon = require('sinon')
let hydrate = require('../')
process.env.CI = true // Suppresses tape issues with progress indicator

test('sanity check', t=> {
  t.plan(1)
  t.ok(hydrate, 'hydrate in scope')
})

test('hydrate invokes `shared` by default', t=> {
  t.plan(1)
  let fake = sinon.fake.yields()
  sinon.replace(hydrate, 'shared', fake)
  hydrate({}, function done(err) {
    if (err) t.fail(err)
    else {
      t.ok(fake.calledOnce, '`shared` invoked once')
    }
  })
  sinon.restore()
});

test('hydrate invokes `install` if specified via params', t=> {
  t.plan(1)
  let fake = sinon.fake.yields()
  sinon.replace(hydrate, 'install', fake)
  hydrate({install: true}, function done(err) {
    if (err) t.fail(err)
    else {
      t.ok(fake.calledOnce, '`install` invoked once')
    }
  })
  sinon.restore()
});

test('hydrate invokes `update` if specified via params', t=> {
  t.plan(1)
  let fake = sinon.fake.yields()
  sinon.replace(hydrate, 'update', fake)
  hydrate({update: true}, function done(err) {
    if (err) t.fail(err)
    else {
      t.ok(fake.calledOnce, '`update` invoked once')
    }
  })
  sinon.restore()
});
