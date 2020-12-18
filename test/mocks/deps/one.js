// Built-ins should be ignored
let path = require('path')

// AWS-SDK should also be ignored
let aws = require('aws-sdk')

// Arc shared and views should be ignored
let shared = require('@architect/shared/something')
let views = require('@architect/views/something')

// Real deps should not be ignored!
// Let's keep it in here with the ignored ones to prove this file was read
let a = require('@a/package')
let b = require('@b/package/method')
let c = require('c/specific/method')
let d = require('d')
