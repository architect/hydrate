let { dirname, join } = require('path')
let {
  cp,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} = require('fs')
const { test } = require('node:test')
const assert = require('node:assert')
let {
  resetAndCopyShared,
  resetAndCopySharedCustom,
  resetAndCopySharedPlugins,
  checkFolderCreation,
  arcFileArtifacts,
  staticArtifacts,
  sharedArtifacts,
  sharedArtifactsDisabled,
  getViewsArtifacts,
  viewsArtifacts,
  viewsArtifactsDisabled,
  pluginArtifacts,
} = require('../_shared')
let hydrate = require('../../..')
process.env.CI = true // Suppresses tape issues with progress indicator

test(`[Shared file copying (default paths)] shared() never uses symlinks by default`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        let path = 'src/http/get-index/node_modules/@architect/shared'
        let file = path + '/shared.md'
        let stat = lstatSync(path).isSymbolicLink()
        assert.ok(!stat, 'shared directory was copied, and is not a symlink')
        assert.strictEqual(readFileSync(file).toString(), 'It me!', 'Copied file is readable')
        resolve()
      })
    })
  })
})

test(`[Shared file copying (custom paths)] shared() never uses symlinks by default`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedCustom(function () {
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        let path = 'src/http/get-index/node_modules/@architect/shared'
        let file = path + '/shared.md'
        let stat = lstatSync(path).isSymbolicLink()
        assert.ok(!stat, 'shared directory was copied, and is not a symlink')
        assert.strictEqual(readFileSync(file).toString(), 'It me!', 'Copied file is readable')
        resolve()
      })
    })
  })
})

test(`[Shared file copying (default paths)] shared() copies shared and views (unless disabled or folder not found; @views not specified)`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        sharedArtifacts.forEach(path => {
          assert.ok(existsSync(path), `Found shared file in ${path}`)
        })
        sharedArtifactsDisabled.forEach(path => {
          assert.ok(!existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
        })
        getViewsArtifacts.forEach(path => {
          if (path.includes('get-')) {
            assert.ok(existsSync(path), `Found views file in GET function ${path}`)
          }
          else {
            assert.ok(!existsSync(path), `Did not find views file in non-GET function ${path}`)
          }
        })
        viewsArtifactsDisabled.forEach(path => {
          assert.ok(!existsSync(path), `Did not find views file in function with @arc views false ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying with plugins (default paths)] shared() copies shared and views, as well as files via plugin`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedPlugins(function () {
      cp(join('src', 'app.plugins'), join('.', 'app.arc'), { recursive: true, force: true },
        function (err) {
          if (err) assert.fail(err)
          hydrate.shared({}, function (err) {
            if (err) assert.fail(err)
            // Check to see if files that are supposed to be there are actually there
            sharedArtifacts.forEach(path => {
              assert.ok(existsSync(path), `Found shared file in ${path}`)
            })
            sharedArtifactsDisabled.forEach(path => {
              assert.ok(!existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
            })
            getViewsArtifacts.forEach(path => {
              if (path.includes('get-')) {
                assert.ok(existsSync(path), `Found views file in GET function ${path}`)
              }
              else {
                assert.ok(!existsSync(path), `Did not find views file in non-GET function ${path}`)
              }
            })
            viewsArtifactsDisabled.forEach(path => {
              assert.ok(!existsSync(path), `Did not find views file in function with @arc views false ${path}`)
            })
            pluginArtifacts.forEach(path => {
              assert.ok(existsSync(path), `Found plugin file in ${path}`)
            })
            let normallyShouldNotBePresent = join('src', 'events', 'silence', 'node_modules')
            assert.ok(existsSync(normallyShouldNotBePresent), 'Silence event folder created just this once!')
            resolve()
          })
        })
    })
  })
})

test(`[Shared file copying (custom paths)] shared() copies shared and views (unless disabled or folder not found; @views not specified)`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedCustom(function () {
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        sharedArtifacts.forEach(path => {
          assert.ok(existsSync(path), `Found shared file in ${path}`)
        })
        sharedArtifactsDisabled.forEach(path => {
          assert.ok(!existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
        })
        getViewsArtifacts.forEach(path => {
          if (path.includes('get-')) {
            assert.ok(existsSync(path), `Found views file in GET function ${path}`)
          }
          else {
            assert.ok(!existsSync(path), `Did not find views file in non-GET function ${path}`)
          }
        })
        viewsArtifactsDisabled.forEach(path => {
          assert.ok(!existsSync(path), `Did not find views file in function with @arc views false ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying (default paths)] shared() views to only @views (unless disabled or folder not found)`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      cp(join('src', 'app.arc-views'), join('.', 'app.arc'), { recursive: true, force: true }, function (err) {
        if (err) assert.fail(err)
        hydrate.shared({}, function (err) {
          if (err) assert.fail(err)
          // Check to see if files that are supposed to be there are actually there
          viewsArtifacts.forEach(path => {
            if (path.includes('get-index') || path.includes('post-up-tents')) {
              assert.ok(existsSync(path), `Found views file in GET function ${path}`)
            }
            else {
              assert.ok(!existsSync(path), `Did not find views file in non-GET function ${path}`)
            }
          })
          viewsArtifactsDisabled.forEach(path => {
            assert.ok(!existsSync(path), `Did not find views file in function with @arc views false ${path}`)
          })
          checkFolderCreation(assert)
          resolve()
        })
      })
    })
  })
})

test(`[Shared file copying (custom paths)] shared() views to only @views (unless disabled or folder not found)`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedCustom(function () {
      cp(join('_shared-custom', 'app.arc-views'), join('.', 'app.arc'), { recursive: true, force: true }, function (err) {
        if (err) assert.fail(err)
        hydrate.shared({}, function (err) {
          if (err) assert.fail(err)
          // Check to see if files that are supposed to be there are actually there
          viewsArtifacts.forEach(path => {
            if (path.includes('get-index') || path.includes('post-up-tents')) {
              assert.ok(existsSync(path), `Found views file in GET function ${path}`)
            }
            else {
              assert.ok(!existsSync(path), `Did not find views file in non-GET function ${path}`)
            }
          })
          viewsArtifactsDisabled.forEach(path => {
            assert.ok(!existsSync(path), `Did not find views file in function with @arc views false ${path}`)
          })
          checkFolderCreation(assert)
          resolve()
        })
      })
    })
  })
})

test(`[Shared file copying (default paths)] shared() copies static.json but not app.arc (Arc v6+)`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        arcFileArtifacts.forEach(path => {
          assert.ok(!existsSync(path), `Did not find app.arc file in ${path}`)
        })
        staticArtifacts.forEach(path => {
          assert.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying (custom paths)] shared() copies static.json but not app.arc (Arc v6+)`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedCustom(function () {
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        arcFileArtifacts.forEach(path => {
          assert.ok(!existsSync(path), `Did not find app.arc file in ${path}`)
        })
        staticArtifacts.forEach(path => {
          assert.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying (default paths)] shared() copies static.json with @static folder configured`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      // Rewrite app.arc to include @static folder directive
      let arcFile = join(process.cwd(), 'app.arc')
      let arc = readFileSync(arcFile).toString()
      arc += '@static\nfolder foo'
      writeFileSync(arcFile, arc)
      assert.ok(true, `Added '@static folder foo' to app.arc`)
      // Move public/ to foo/
      renameSync(join(process.cwd(), 'public'), join(process.cwd(), 'foo'))
      assert.ok(existsSync(join(process.cwd(), 'foo', 'static.json')), 'public/static.json moved into foo/static.json')
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        staticArtifacts.forEach(path => {
          assert.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying (custom paths)] shared() copies static.json with @static folder configured`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedCustom(function () {
      // Rewrite app.arc to include @static folder directive
      let arcFile = join(process.cwd(), 'app.arc')
      let arc = readFileSync(arcFile).toString()
      arc += '@static\nfolder foo'
      writeFileSync(arcFile, arc)
      assert.ok(true, `Added '@static folder foo' to app.arc`)
      // Move public/ to foo/
      renameSync(join(process.cwd(), 'public'), join(process.cwd(), 'foo'))
      assert.ok(existsSync(join(process.cwd(), 'foo', 'static.json')), 'public/static.json moved into foo/static.json')
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        staticArtifacts.forEach(path => {
          assert.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying (default paths)] shared() should remove files in functions that do not exist in shared and views`, async () => {
  await new Promise((resolve) => {
    resetAndCopyShared(function () {
      let sharedStragglers = sharedArtifacts.map((p) => {
        let dir = dirname(p)
        mkdirSync(dir, { recursive: true })
        let file = join(dir, 'straggler.json')
        writeFileSync(file, '{surprise:true}')
        return file
      })
      let viewsStragglers = getViewsArtifacts.map((p) => {
        let dir = dirname(p)
        mkdirSync(dir, { recursive: true })
        let file = join(dir, 'straggler.json')
        writeFileSync(file, '{surprise:true}')
        return file
      })
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        sharedStragglers.forEach(path => {
          assert.ok(!existsSync(path), `shared straggler file removed from ${path}`)
        })
        viewsStragglers.forEach(path => {
          assert.ok(!existsSync(path), `views straggler file removed from ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

test(`[Shared file copying (custom paths)] shared() should remove files in functions that do not exist in shared and views`, async () => {
  await new Promise((resolve) => {
    resetAndCopySharedCustom(function () {
      let sharedStragglers = sharedArtifacts.map((p) => {
        let dir = dirname(p)
        mkdirSync(dir, { recursive: true })
        let file = join(dir, 'straggler.json')
        writeFileSync(file, '{surprise:true}')
        return file
      })
      let viewsStragglers = getViewsArtifacts.map((p) => {
        let dir = dirname(p)
        mkdirSync(dir, { recursive: true })
        let file = join(dir, 'straggler.json')
        writeFileSync(file, '{surprise:true}')
        return file
      })
      hydrate.shared({}, function (err) {
        if (err) assert.fail(err)
        // Check to see if files that are supposed to be there are actually there
        sharedStragglers.forEach(path => {
          assert.ok(!existsSync(path), `shared straggler file removed from ${path}`)
        })
        viewsStragglers.forEach(path => {
          assert.ok(!existsSync(path), `views straggler file removed from ${path}`)
        })
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})
