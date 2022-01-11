// ok
import a from 'a'
import { createRequire } from 'module'
let require = createRequire(import.meta.url)
let mod = require('b')

// ignored
let strings = [
  'require',
  'import',
]
