// Built-ins should be ignored
let path = require('path')

// AWS-SDK should also be ignored
let aws = require('aws-sdk')

// Real deps should not be ignored!
// Let's keep it in here with the ignored ones to prove this file was read
let a = require('a')
