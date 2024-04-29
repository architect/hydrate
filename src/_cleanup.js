let { existsSync, mkdirSync, renameSync } = require('fs')
let { join } = require('path')

// Best effort local artifact cleanup
module.exports = function cleanup (installed) {
  if (installed) {
    installed.forEach(params => {
      let { dir, file, swap, remove } = params
      let dest
      try {
        if (file === 'package.json') {
          dest = join(dir, 'node_modules', '_arc-autoinstall')
        }
        else if (file === 'requirements.txt') {
          dest = join(dir, 'vendor', '_arc_autoinstall')
        }
        else return

        mkdirSync(dest, { recursive: true })
        remove.forEach(f => {
          let before = join(dir, f)
          let after = join(dest, f)
          if (existsSync(before)) renameSync(before, after)
        })
        if (swap) {
          renameSync(join(dir, swap), join(dir, file))
        }
      }
      catch { null } // Swallow errors, we may have to bubble something else
    })
  }
}
