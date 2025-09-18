let test = require('tape')

// Mock the child_process module to avoid actual command execution
let mockChildProcess = {
  exec: (cmd, opts, callback) => {
    // Mock successful execution
    callback(null, 'mock success', '')
  },
}

// Mock the _printer module
let mockPrinter = (params, callback) => {
  callback()
}

// Mock the lib module
let mockLib = {
  destroyPath: () => {},
}

// Override requires for the install-update module
let Module = require('module')
let originalRequire = Module.prototype.require

Module.prototype.require = function (id) {
  if (id === 'child_process') return mockChildProcess
  if (id === '../_printer') return mockPrinter
  if (id === '../lib') return mockLib
  return originalRequire.apply(this, arguments)
}

let installUpdate = require('../../../../src/actions/install-update')

// Restore original require
Module.prototype.require = originalRequire

test('install-update handles absolute paths correctly', t => {
  t.plan(1)

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
            runtime: 'nodejs18.x',
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
      error: () => {},
    },
    verbose: false,
  }

  // The test should complete without throwing an error
  installUpdate(params, (err) => {
    t.notOk(err, 'install-update completes successfully with absolute path')
  })
})

test('install-update handles relative paths correctly', t => {
  t.plan(1)

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
      error: () => {},
    },
    verbose: false,
  }

  // The test should complete without throwing an error
  installUpdate(params, (err) => {
    t.notOk(err, 'install-update completes successfully with relative path')
  })
})
