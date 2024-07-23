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
// let cp = require('cpr')
let test = require('tape')
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
let symlink = true

test('Does not exit code 1', t => {
  process.on('exit', code => { if (code === 1) t.fail('Exited code 1!') })
  t.end()
})

// As of late 2020, this test passes GHCI in both windows-latest and windows-2016
// This is strange, bc windows-2016 should be running a pre-Windows-symlink build (10.0.14393 Build 3930)
// See: https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/
test(`[Shared file symlinking (default paths)] shared() never uses symlinks by default`, t => {
  t.plan(2)
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        let path = 'src/http/get-index/node_modules/@architect/shared'
        let file = path + '/shared.md'
        let stat = lstatSync(path).isSymbolicLink()
        t.ok(stat, 'shared directory is a symlink')
        t.equal(readFileSync(file).toString(), 'It me!', 'Symlinked file is readable')
      }
    })
  })
})

test(`[Shared file symlinking (custom paths)] shared() never uses symlinks by default`, t => {
  t.plan(2)
  resetAndCopySharedCustom(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        let path = 'src/http/get-index/node_modules/@architect/shared'
        let file = path + '/shared.md'
        let stat = lstatSync(path).isSymbolicLink()
        t.ok(stat, 'shared directory is a symlink')
        t.equal(readFileSync(file).toString(), 'It me!', 'Symlinked file is readable')
      }
    })
  })
})

test(`[Shared file symlinking (default paths)] shared() copies shared and views (unless disabled or folder not found; @views not specified)`, t => {
  t.plan(
    sharedArtifacts.length +
    getViewsArtifacts.length +
    sharedArtifactsDisabled.length +
    viewsArtifactsDisabled.length + 1,
  )
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        sharedArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found shared file in ${path}`)
        })
        sharedArtifactsDisabled.forEach(path => {
          t.notOk(existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
        })
        getViewsArtifacts.forEach(path => {
          if (path.includes('get-')) {
            t.ok(existsSync(path), `Found views file in GET function ${path}`)
          }
          else {
            t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
          }
        })
        viewsArtifactsDisabled.forEach(path => {
          t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking with plugins (default paths)] shared() copies shared and views, as well as files via plugin`, t => {
  t.plan(
    sharedArtifacts.length +
    getViewsArtifacts.length +
    sharedArtifactsDisabled.length +
    viewsArtifactsDisabled.length +
    pluginArtifacts.length + 1,
  )
  resetAndCopySharedPlugins(t, function () {
    cp(join('src', 'app.plugins'), join('.', 'app.arc'), { recursive: true },
      function (err) {
        if (err) t.fail(err)
        else {
          hydrate.shared({}, function (err) {
            if (err) t.fail(err)
            else {
            // Check to see if files that are supposed to be there are actually there
              sharedArtifacts.forEach(path => {
                t.ok(existsSync(path), `Found shared file in ${path}`)
              })
              sharedArtifactsDisabled.forEach(path => {
                t.notOk(existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
              })
              getViewsArtifacts.forEach(path => {
                if (path.includes('get-')) {
                  t.ok(existsSync(path), `Found views file in GET function ${path}`)
                }
                else {
                  t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
                }
              })
              viewsArtifactsDisabled.forEach(path => {
                t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
              })
              pluginArtifacts.forEach(path => {
                t.ok(existsSync(path), `Found plugin file in ${path}`)
              })
              let normallyShouldNotBePresent = join('src', 'events', 'silence', 'node_modules')
              t.ok(existsSync(normallyShouldNotBePresent), 'Silence event folder created just this once!')
            }
          })
        }
      })
  })
})

test(`[Shared file symlinking (custom paths)] shared() copies shared and views (unless disabled or folder not found; @views not specified)`, t => {
  t.plan(
    sharedArtifacts.length +
    getViewsArtifacts.length +
    sharedArtifactsDisabled.length +
    viewsArtifactsDisabled.length + 1,
  )
  resetAndCopySharedCustom(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        sharedArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found shared file in ${path}`)
        })
        sharedArtifactsDisabled.forEach(path => {
          t.notOk(existsSync(path), `Did not find shared file in function with @arc shared false ${path}`)
        })
        getViewsArtifacts.forEach(path => {
          if (path.includes('get-')) {
            t.ok(existsSync(path), `Found views file in GET function ${path}`)
          }
          else {
            t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
          }
        })
        viewsArtifactsDisabled.forEach(path => {
          t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking (default paths)] shared() views to only @views (unless disabled or folder not found)`, t => {
  t.plan(viewsArtifacts.length + viewsArtifactsDisabled.length + 1)
  resetAndCopyShared(t, function () {
    cp(join('src', 'app.arc-views'), join('.', 'app.arc'), { recursive: true }, function (err) {
      if (err) t.fail(err)
      else {
        hydrate.shared({ symlink }, function (err) {
          if (err) t.fail(err)
          else {
            // Check to see if files that are supposed to be there are actually there
            viewsArtifacts.forEach(path => {
              if (path.includes('get-index') || path.includes('post-up-tents')) {
                t.ok(existsSync(path), `Found views file in GET function ${path}`)
              }
              else {
                t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
              }
            })
            viewsArtifactsDisabled.forEach(path => {
              t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
            })
            checkFolderCreation(t)
          }
        })
      }
    })
  })
})

test(`[Shared file symlinking (custom paths)] shared() views to only @views (unless disabled or folder not found)`, t => {
  t.plan(viewsArtifacts.length + viewsArtifactsDisabled.length + 1)
  resetAndCopySharedCustom(t, function () {
    cp(join('_shared-custom', 'app.arc-views'), join('.', 'app.arc'), { recursive: true }, function (err) {
      if (err) t.fail(err)
      else {
        hydrate.shared({ symlink }, function (err) {
          if (err) t.fail(err)
          else {
            // Check to see if files that are supposed to be there are actually there
            viewsArtifacts.forEach(path => {
              if (path.includes('get-index') || path.includes('post-up-tents')) {
                t.ok(existsSync(path), `Found views file in GET function ${path}`)
              }
              else {
                t.notOk(existsSync(path), `Did not find views file in non-GET function ${path}`)
              }
            })
            viewsArtifactsDisabled.forEach(path => {
              t.notOk(existsSync(path), `Did not find views file in function with @arc views false ${path}`)
            })
            checkFolderCreation(t)
          }
        })
      }
    })
  })
})

test(`[Shared file symlinking (default paths)] shared() copies static.json but not app.arc (Arc v6+)`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length + 1)
  resetAndCopyShared(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        arcFileArtifacts.forEach(path => {
          t.notOk(existsSync(path), `Did not find app.arc file in ${path}`)
        })
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking (custom paths)] shared() copies static.json but not app.arc (Arc v6+)`, t => {
  t.plan(arcFileArtifacts.length + staticArtifacts.length + 1)
  resetAndCopySharedCustom(t, function () {
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        arcFileArtifacts.forEach(path => {
          t.notOk(existsSync(path), `Did not find app.arc file in ${path}`)
        })
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking (default paths)] shared() copies static.json with @static folder configured`, t => {
  t.plan(staticArtifacts.length + 3)
  resetAndCopyShared(t, function () {
    // Rewrite app.arc to include @static folder directive
    let arcFile = join(process.cwd(), 'app.arc')
    let arc = readFileSync(arcFile).toString()
    arc += '@static\nfolder foo'
    writeFileSync(arcFile, arc)
    t.pass(`Added '@static folder foo' to app.arc`)
    // Move public/ to foo/
    renameSync(join(process.cwd(), 'public'), join(process.cwd(), 'foo'))
    t.ok(existsSync(join(process.cwd(), 'foo', 'static.json')), 'public/static.json moved into foo/static.json')
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking (custom paths)] shared() copies static.json with @static folder configured`, t => {
  t.plan(staticArtifacts.length + 3)
  resetAndCopySharedCustom(t, function () {
    // Rewrite app.arc to include @static folder directive
    let arcFile = join(process.cwd(), 'app.arc')
    let arc = readFileSync(arcFile).toString()
    arc += '@static\nfolder foo'
    writeFileSync(arcFile, arc)
    t.pass(`Added '@static folder foo' to app.arc`)
    // Move public/ to foo/
    renameSync(join(process.cwd(), 'public'), join(process.cwd(), 'foo'))
    t.ok(existsSync(join(process.cwd(), 'foo', 'static.json')), 'public/static.json moved into foo/static.json')
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        staticArtifacts.forEach(path => {
          t.ok(existsSync(path), `Found static.json file in ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking (default paths)] shared() should remove files in functions that do not exist in shared and views`, t => {
  t.plan(sharedArtifacts.length + getViewsArtifacts.length + 1)
  resetAndCopyShared(t, function () {
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
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        sharedStragglers.forEach(path => {
          t.notOk(existsSync(path), `shared straggler file removed from ${path}`)
        })
        viewsStragglers.forEach(path => {
          t.notOk(existsSync(path), `views straggler file removed from ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Shared file symlinking (custom paths)] shared() should remove files in functions that do not exist in shared and views`, t => {
  t.plan(sharedArtifacts.length + getViewsArtifacts.length + 1)
  resetAndCopySharedCustom(t, function () {
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
    hydrate.shared({ symlink }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        sharedStragglers.forEach(path => {
          t.notOk(existsSync(path), `shared straggler file removed from ${path}`)
        })
        viewsStragglers.forEach(path => {
          t.notOk(existsSync(path), `views straggler file removed from ${path}`)
        })
        checkFolderCreation(t)
      }
    })
  })
})
