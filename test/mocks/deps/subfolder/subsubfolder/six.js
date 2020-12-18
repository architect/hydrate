let something = process.env.SOMETHING
require(something)

// Also require 'c' to test de-duping
require('c')
