/*
Copyright 2015, Yahoo Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt
*/
var yaml = require('js-yaml')
var Transform = require('readable-stream').Transform

var BAIL = 'Bail out!'

function MakeTap () {
  Transform.call(this)
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
  this.result({
    message: message,
    directive: directive,
    dataObj: processError(err)
  })
}

MakeTap.prototype.bail = function (message) {
  this.writeln(message && message.length ? BAIL + ' ' + message : BAIL)
}

MakeTap.prototype.result = function (result) {
  var count = ' ' + ++this.count
  var directive = result.directive ? ' # ' + result.directive : ''
  var message = result.message ? ' ' + result.message : ''
  this.writeln((result.ok ? 'ok' : 'not ok') + count + message + directive)
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

module.exports = function () {
  return new MakeTap()
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
