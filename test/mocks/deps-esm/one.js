// Built-ins should be ignored
import path from 'path'
import fs from 'node:fs'

// AWS-SDK should also be ignored
import aws from 'aws-sdk'

// Arc shared and views should be ignored
import shared from '@architect/shared/something.js'
import views from '@architect/views/something.js'

// Filesystem paths should be ignored
import file1 from 'file://./hi.js'
import file2 from 'file://../../hi.js'
import file3 from 'file:///hi.js'
import file4 from './hi.js'
import file5 from '../../hi.js'
import file6 from '/hi.js'

// Real deps should not be ignored!
// Let's keep it in here with the ignored ones to prove this file was read
import a from '@a/package'
import b from '@b/package/method'
import c from 'c/specific/method'
import d from 'd'
