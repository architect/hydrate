const { test } = require('node:test')
const assert = require('node:assert')
const Module = require('module')

let called = []
function caller (type, callback) {
  called.push(type)
  callback()
}
let run = (installing, params, callback) => {
  if (installing) caller('install', callback)
  else caller('update', callback)
}
let shared = (p, callback) => caller('shared', callback)

// Mock modules using Module._load override
const originalLoad = Module._load
Module._load = function (request, parent) {
  if (request === './hydrate' && parent && parent.filename && parent.filename.endsWith('index.js')) {
    return run
  }
  if (request === './shared' && parent && parent.filename && parent.filename.endsWith('index.js')) {
    return shared
  }
  return originalLoad.apply(this, arguments)
}

const hydrate = require('../../')

// Restore original Module._load
Module._load = originalLoad

process.env.CI = true // Suppresses issues with progress indicator

function reset () {
  called = []
}

test('Set up env', async () => {
  assert.ok(hydrate, 'Hydrate module is present')
})

test('Main hydration methods are present', async () => {
  assert.ok(hydrate.install, 'install method is present')
  assert.ok(hydrate.update, 'update method is present')
  assert.ok(hydrate.shared, 'shared method is present')
})

test('hydrate.install invokes install', async () => {
  await new Promise((resolve) => {
    hydrate.install({}, function done (err) {
      if (err) assert.fail(err)
      else {
        assert.strictEqual(called.length, 1, 'Invoked one method')
        assert.strictEqual(called[0], 'install', 'Invoked install')
      }
      reset()
      resolve()
    })
  })
})

test('hydrate.update invokes update', async () => {
  await new Promise((resolve) => {
    hydrate.update({}, function done (err) {
      if (err) assert.fail(err)
      else {
        assert.strictEqual(called.length, 1, 'Invoked one method')
        assert.strictEqual(called[0], 'update', 'Invoked update')
      }
      reset()
      resolve()
    })
  })
})

test('hydrate.shared invokes shared', async () => {
  await new Promise((resolve) => {
    hydrate.shared({}, function done (err) {
      if (err) assert.fail(err)
      else {
        assert.strictEqual(called.length, 1, 'Invoked one method')
        assert.strictEqual(called[0], 'shared', 'Invoked shared')
      }
      reset()
      resolve()
    })
  })
})
