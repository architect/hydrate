let something = process.env.SOMETHING
require(something)

for (let item of [ 1, 2, 3 ]) {
  require(item)
}

// Also require 'c' to test de-duping
require('c')
