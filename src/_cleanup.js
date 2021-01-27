let { existsSync, mkdirSync, renameSync } = require('fs')
let { join } = require('path')

// Best effort local artifact cleanup
module.exports = function cleanup (installed) {
  if (installed) {
    installed.forEach(i => {
      let { dir, file, remove } = i
      try {
        if (file === 'package.json') {
          let dest = join(dir, 'node_modules', '_arc-autoinstall')
          mkdirSync(dest, { recursive: true })
          remove.forEach(f => {
            let before = join(dir, f)
            let after = join(dest, f)
            if (existsSync(before)) renameSync(before, after)
          })
        }
      }
      catch (err) { null } // Swallow errors, we may have to bubble something else
    })
  }
}
