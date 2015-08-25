/*
Copyright 2015, Yahoo Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt
*/
var yaml = require('js-yaml')
var Transform = require('readable-stream').Transform

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
    dataObj: this.processError(err)
  })
}

MakeTap.prototype.result = function (result) {
  var count = ' ' + ++this.count
  var directive = result.directive ? ' # ' + result.directive : ''
  var message = result.message ? ' ' + result.message : ''
  this.writeln((result.ok ? 'ok' : 'not ok') + count + message + directive)
  if (result.dataObj) {
    this.writeln('  ---')
    this.writeln(yaml.safeDump(result.dataObj).split('\n').map(function (l) {
      return l.length ? '  ' + l : ''
    }).join('\n'))
    this.writeln('  ...')
  }
}

MakeTap.prototype.processError = function (err) {
  var obj = {}
  obj.name = err.name
  obj.message = err.message
  if (err.name === 'AssertionError') {
    obj.operator = err.operator
    obj.expected = err.expected
    obj.actual = err.actual
  }
  obj.stack = err.stack
  return obj
}

module.exports = function () {
  return new MakeTap()
}
