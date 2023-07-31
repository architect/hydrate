let { dirname, join } = require('path')
let { existsSync } = require('fs')
let cp = require('cpr')
let { globSync } = require('glob')
let { pathToUnix } = require('@architect/utils')
let { destroyPath } = require('../../src/lib')

let mockSource    = join(__dirname, '..', 'mocks', 'normal')
let mockTmp       = join(__dirname, '..', 'tmp')
let pythonShared  = join('vendor', 'shared')
let rubyShared    = join('vendor', 'shared')
let nodeShared    = join('node_modules', '@architect', 'shared')
let pythonViews   = join('vendor', 'views')
let rubyViews     = join('vendor', 'views')
let nodeViews     = join('node_modules', '@architect', 'views')

// Manual list of mock app resources. If you change the mock app, update these!
let arcHttp = [
  'get-index',
  'get-memories',
  'post-up-tents',      // autoinstall target
  'put-aside_hangups',  // autoinstall target
  'put-on_your_boots',
  'options-are_plentiful',
].map(route => join('src', 'http', route))

let arcAutoinstall = [ arcHttp[2], arcHttp[3] ]

let arcEvents = [ 'just-being-in-nature' ]
  .map(route => join('src', 'events', route))

let arcQueues = [ 'parks-to-visit' ]
  .map(route => join('src', 'queues', route))

let arcScheduled = [ 'hikes-with-friends' ]
  .map(route => join('src', 'scheduled', route))

let arcTablesStreams = [ 'rivers' ]
  .map(route => join('src', 'tables-streams', route))

let arcCustomPath = [ 'in-the-clouds' ]
  .map(route => join('src', 'head', route))
  .concat([ 'anywhere' ])

let arcPluginLambda = [ 'newlambda' ]
  .map(route => join('src', 'myplugin', route))

/**
 * Functions by runtime
 */
let pythonFunctions = [ join('src', 'http', 'get-memories'), join('src', 'http', 'put-aside_hangups') ]
let rubyFunctions = [ join('src', 'http', 'delete-badness_in_life') ]
let nodeFunctions = arcHttp.concat(arcEvents, arcQueues, arcScheduled, arcTablesStreams, arcCustomPath, arcPluginLambda)
  .filter(p => !pythonFunctions.includes(p) && !rubyFunctions.includes(p))

/**
 * Runtime dependencies
 */
let pythonDependencies = pythonFunctions
  .map(p => join(p, 'vendor', 'pipdeptree'))

let rubyDependencies = () => rubyFunctions
  .map(p => globSync(pathToUnix(`${p}/vendor/bundle/ruby/**/gems/a-0.2.1`))[0])

let nodeDependencies = nodeFunctions
  .map(p => join(p, 'node_modules', 'tiny-json-http'))

/**
 * Runtime shared/views dependencies
 */
let pythonSharedDependencies = pythonFunctions
  .map(p => join(p, pythonShared, 'node_modules', 'tiny-json-http'))

let pythonViewsDependencies = pythonFunctions
  .map(p => join(p, pythonViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-') || p.includes('any-'))

let rubySharedDependencies = rubyFunctions
  .map(p => join(p, rubyShared, 'node_modules', 'tiny-json-http'))

let rubyViewsDependencies = rubyFunctions
  .map(p => join(p, rubyViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-') || p.includes('any-'))

let nodeSharedDependencies = nodeFunctions
  .map(p => join(p, nodeShared, 'node_modules', 'tiny-json-http'))

let nodeViewsDependencies = nodeFunctions
  .map(p => join(p, nodeViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-') || p.includes('any-'))

/**
 * Artifact paths
 */
let arcFileArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonShared, '.arc')))
  .concat(rubyFunctions.map(p => join(p, rubyShared, '.arc')))
  .concat(nodeFunctions.map(p => join(p, nodeShared, '.arc')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, '.arc')))
  .concat(arcAutoinstall.map((p, i) => join(p, i ? pythonShared : nodeShared, '.arc')))

let staticArtifacts = arcFileArtifacts
  .map(p => join(dirname(p), 'static.json'))

let sharedArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonShared, 'shared.md')))
  .concat(rubyFunctions.map(p => join(p, rubyShared, 'shared.md')))
  .concat(nodeFunctions.map(p => join(p, nodeShared, 'shared.md')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, 'shared.md')))
  .concat(arcAutoinstall.map((p, i) => join(p, i ? pythonShared : nodeShared, 'shared.md')))

let threePluginFiles = (path, vendor) => [
  join(path, vendor, '1.md'),
  join(path, vendor, 'plugin-file-2.md'),
  join(path, vendor, 'plugin-folder-1', 'plugin-file-3.md'),
  join(path, vendor, 'plugin-folder-2', 'subfolder', 'plugin-file-4.md'),
]
let pluginArtifacts = []
  .concat(pythonFunctions.map(p => threePluginFiles(p, 'vendor')))
  .concat(rubyFunctions.map(p => threePluginFiles(p, 'vendor')))
  .concat(nodeFunctions.map(p => threePluginFiles(p, 'node_modules')))
  // hydrate.copy copies to all functions, even with shared disabled
  .concat([ join('src', 'events', 'silence') ].map(p => threePluginFiles(p, 'node_modules')))
  .concat(arcCustomPath.map(p => threePluginFiles(p, 'node_modules')))
  .concat(arcAutoinstall.map((p, i) => threePluginFiles(p, i ? 'vendor' : 'node_modules')))
  .flat()

let sharedArtifactsDisabled = [
  join('src', 'http', 'any-time_is_good-catchall', nodeShared, 'shared.md')
]

// Represents src/views without @views pragma (i.e. all GET fns receive views)
let getViewsArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonViews, 'views.md')))
  .concat(rubyFunctions.map(p => join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => join(p, nodeViews, 'views.md')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, 'views.md')))
  .filter(p => p.includes('get-') || p.includes('any-'))

// Represents @views pragma
let viewsArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonViews, 'views.md')))
  .concat(rubyFunctions.map(p => join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => join(p, nodeViews, 'views.md')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, 'views.md')))

let viewsArtifactsDisabled = [
  join('src', 'http', 'any-time_is_good-catchall', nodeShared, 'views.md')
]


// Test resetters
function reset (t, callback) {
  process.chdir(join(__dirname, '..'))
  destroyPath(mockTmp)
  cp(mockSource, mockTmp, { overwrite: true }, function (err) {
    if (err) t.fail(err)
    else {
      process.chdir(mockTmp)
      callback()
    }
  })
}
function resetAndCopyShared (t, callback) {
  reset(t, function () {
    cp('_shared', 'src', { overwrite: true }, function done (err) {
      if (err) t.fail(err)
      else callback()
    })
  })
}
function resetAndCopySharedAutoinstall (t, callback) {
  reset(t, function () {
    cp('_shared-autoinstall', '.', { overwrite: true }, function done (err) {
      if (err) t.fail(err)
      else callback()
    })
  })
}
function resetAndCopySharedCustom (t, callback) {
  reset(t, function () {
    cp('_shared-custom', '.', { overwrite: true }, function done (err) {
      if (err) t.fail(err)
      else callback()
    })
  })
}
function resetAndCopySharedPlugins (t, callback) {
  reset(t, function () {
    cp('_shared-plugins', 'src', { overwrite: true }, function done (err) {
      if (err) t.fail(err)
      else callback()
    })
  })
}

// Ensure we don't create empty folders with copied files
let checkFolderCreation = t => t.notOk(existsSync(join('src', 'events', 'silence')), `Did not copy and create function folder that should not exist`)


module.exports = {
  reset,
  resetAndCopyShared,
  resetAndCopySharedAutoinstall,
  resetAndCopySharedCustom,
  resetAndCopySharedPlugins,
  checkFolderCreation,

  arcHttp,
  arcEvents,
  arcQueues,
  arcScheduled,
  arcTablesStreams,

  arcAutoinstall,

  pythonFunctions,
  rubyFunctions,
  nodeFunctions,

  pythonDependencies,
  rubyDependencies,
  nodeDependencies,

  pythonSharedDependencies,
  pythonViewsDependencies,
  rubySharedDependencies,
  rubyViewsDependencies,
  nodeSharedDependencies,
  nodeViewsDependencies,

  arcFileArtifacts,
  staticArtifacts,
  sharedArtifacts,
  sharedArtifactsDisabled,
  getViewsArtifacts,
  viewsArtifacts,
  viewsArtifactsDisabled,
  pluginArtifacts,

  mockTmp,
}
