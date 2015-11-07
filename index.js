/*
Copyright 2015, Yahoo Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt
*/
var yaml = require('js-yaml')
var Transform = require('readable-stream').Transform

var BAIL = 'Bail out!'

function MakeTap (opts) {
  Transform.call(this)
  opts = opts || {}
  this.countEnabled = typeof opts.count !== 'boolean' ? true : opts.count
  this.writeln('TAP version 13')
  this.count = 0
}
require('util').inherits(MakeTap, Transform)

MakeTap.prototype._transform = function (data, encoding, callback) {
  callback(null, data)
}

MakeTap.prototype.writeln = function (data) {
  this.write(data + '\n')
}

MakeTap.prototype.diag = function (data) {
  this.writeln(data.split('\n').map(function (l) {
    return '# ' + l
  }).join('\n'))
}

MakeTap.prototype.plan = function (num) {
  this.writeln('1..' + num)
}

MakeTap.prototype.pass = function (message, directive) {
  this.result({message: message, ok: true, directive: directive})
}

MakeTap.prototype.fail = function (message, directive, err) {
  if (arguments.length === 2 && typeof directive !== 'string') {
    err = directive
    directive = undefined
  }
  if (arguments.length === 1 && typeof message !== 'string') {
    err = message
    message = undefined
    directive = undefined
  }
  this.result({message: message, directive: directive})
  this.yaml(processError(err))
}

MakeTap.prototype.bail = function (message) {
  this.writeln(message && message.length ? BAIL + ' ' + message : BAIL)
}

MakeTap.prototype.result = function (result) {
  var line = [(result.ok ? 'ok' : 'not ok')]
  if (this.countEnabled) line.push(++this.count)
  if (result.message) line.push(result.message)
  if (result.directive) line.push('# ' + result.directive)
  this.writeln(line.join(' '))
  if (typeof result.dataObj === 'object') {
    this.yaml(result.dataObj)
  }
}

MakeTap.prototype.yaml = function (data) {
  this.writeln('  ---')
  this.writeln(yaml.safeDump(data).split('\n').map(function (l) {
    return l.length ? '  ' + l : ''
  }).join('\n'))
  this.writeln('  ...')
}

module.exports = function (opts) {
  return new MakeTap(opts)
}

function processError (err) {
  var obj = {}
  applyProp(err, obj, 'name')
  applyProp(err, obj, 'message')
  if (err.name === 'AssertionError') {
    applyProp(err, obj, 'operator')
    applyProp(err, obj, 'expected')
    applyProp(err, obj, 'actual')
  }
  applyProp(err, obj, 'stack')
  return obj
}

function applyProp (from, to, name) {
  if (from[name]) to[name] = from[name]
}
