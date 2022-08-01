// Built-ins should be ignored
let path = require('path')
let fs = require('node:fs')

// AWS-SDK should also be ignored
let aws = require('aws-sdk')

// Arc shared and views should be ignored
let shared = require('@architect/shared/something')
let views = require('@architect/views/something')

// Filesystem paths should be ignored
let file1 = require('./hi.js')
let file2 = require('../../hi.js')
let file3 = require('/hi.js')

// Real deps should not be ignored!
// Let's keep it in here with the ignored ones to prove this file was read
let a = require('@a/package')
let b = require('@b/package/method')
let c = require('c/specific/method')
let d = require('d')
