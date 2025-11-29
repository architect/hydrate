const { test } = require('node:test')
const assert = require('node:assert')
const Module = require('module')

test('install-update handles absolute paths correctly', async () => {
  // Mock modules using Module._load override
  const originalLoad = Module._load
  Module._load = function (request) {
    if (request === 'child_process') {
      return {
        exec: (cmd, opts, callback) => {
          callback(null, 'mock success', '')
        },
      }
    }
    if (request === '../_printer') {
      return (params, callback) => {
        callback()
      }
    }
    if (request === '../lib') {
      return {
        destroyPath: () => {},
      }
    }
    return originalLoad.apply(this, arguments)
  }

  // Clear require cache for install-update module
  const modulePath = require.resolve('../../../../src/actions/install-update')
  delete require.cache[modulePath]

  const installUpdate = require('../../../../src/actions/install-update')

  // Restore original Module._load
  Module._load = originalLoad

  // Mock inventory with project cwd and lambdasBySrcDir
  let mockInventory = {
    inv: {
      _project: {
        cwd: '/mock/project/root',
      },
      _arc: {
        deployStage: false,
      },
      lambdasBySrcDir: {
        '/absolute/path/to/lambda': {
          config: {
            runtime: 'nodejs20.x',
          },
        },
      },
    },
  }

  // Mock params for absolute path case
  let params = {
    action: 'Hydrat',
    env: {},
    file: '/absolute/path/to/lambda/package.json',
    installing: true,
    inventory: mockInventory,
    local: false,
    shell: '/bin/sh',
    timeout: 30000,
    update: {
      start: () => ({ cancel: () => {} }),
      cancel: () => {},
      status: () => {},
      error: (e) => { console.log(e) },
    },
    verbose: false,
  }

  // The test should complete without throwing an error
  await new Promise((resolve) => {
    installUpdate(params, (err) => {
      assert.ok(!err, 'install-update completes successfully with absolute path')
      resolve()
    })
  })
})

test('install-update handles relative paths correctly', async () => {
  // Mock modules using Module._load override
  const originalLoad = Module._load
  Module._load = function (request) {
    if (request === 'child_process') {
      return {
        exec: (cmd, opts, callback) => {
          callback(null, 'mock success', '')
        },
      }
    }
    if (request === '../_printer') {
      return (params, callback) => {
        callback()
      }
    }
    if (request === '../lib') {
      return {
        destroyPath: () => {},
      }
    }
    return originalLoad.apply(this, arguments)
  }

  // Clear require cache for install-update module
  const modulePath = require.resolve('../../../../src/actions/install-update')
  delete require.cache[modulePath]

  const installUpdate = require('../../../../src/actions/install-update')

  // Restore original Module._load
  Module._load = originalLoad

  // Mock inventory with project cwd and lambdasBySrcDir
  let mockInventory = {
    inv: {
      _project: {
        cwd: '/mock/project/root',
      },
      _arc: {
        deployStage: false,
      },
      lambdasBySrcDir: {
        '/mock/project/root/src/http/get-index': {
          config: {
            runtime: 'nodejs18.x',
          },
        },
      },
    },
  }

  // Mock params for relative path case
  let params = {
    action: 'Hydrat',
    env: {},
    file: 'src/http/get-index/package.json',
    installing: true,
    inventory: mockInventory,
    local: false,
    shell: '/bin/sh',
    timeout: 30000,
    update: {
      start: () => ({ cancel: () => {} }),
      cancel: () => {},
      status: () => {},
      error: (e) => { console.log(e) },
    },
    verbose: false,
  }

  // The test should complete without throwing an error
  await new Promise((resolve) => {
    installUpdate(params, (err) => {
      assert.ok(!err, 'install-update completes successfully with relative path')
      resolve()
    })
  })
})
