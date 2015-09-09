var makeTap = require('../index')
var fs = require('fs')
var assert = require('assert')

var testOutput = fs.readFileSync(require('path').join(__dirname, 'test1.tap'), 'utf8')

var testErr = {
  name: 'Error',
  message: 'foobar',
  stack: 'Error: foobar\n    line1\n    line2'
}

var testAssertionError = {
  name: 'AssertionError',
  message: 'foomessage',
  operator: '==',
  expected: 'five',
  actual: 'four',
  stack: 'AssertionError: foomessage\n    line1\n    line2'
}

var testTap = makeTap()

testTap.writeln('# foo')

testTap.diag('bar')

testTap.plan(6)

testTap.pass()
testTap.pass('foo')
testTap.pass('bar', 'thing')

testTap.fail(testErr)
testTap.fail('foo', testErr)
testTap.fail('bar', 'thing', testAssertionError)
testTap.fail({name: 'not a real error'})

testTap.end()

var buff = ''
testTap
.on('data', function (d) {
  buff += d
})
.on('end', function () {
  assert.equal(testOutput, buff)
  console.log('# success!')
})
.pipe(process.stdout)
