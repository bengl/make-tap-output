var makeTap = require('../index')
var fs = require('fs')
var assert = require('assert')

var testOutput = fs.readFileSync(require('path').join(__dirname, 'test1.tap'), 'utf8')
var buff = ''
var exitCode = 0

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

testTap.bail()
testTap.bail('This is a bail reason')

testTap.yaml({
  some: {
    data: {
      foo: 'bar'
    }
  },
  stuff: 1
})

testTap.end()

var testTap2 = makeTap({count: false})

testTap2.pass()
testTap2.pass('foo')

testTap2.end()

testTapPipe(testTap)
testTapPipe(testTap2)
testTap2.on('end', function () {
  process.nextTick(function () {
    var mainTap = makeTap()
    testOutput = testOutput.split('\n')
    buff = buff.split('\n')
    mainTap.plan(testOutput.length)
    assertEqual(mainTap, testOutput.length, buff.length)
    testOutput.forEach(function (line, i) {
      assertEqual(mainTap, line, buff[i])
    })
    mainTap.end()
    mainTap.pipe(process.stdout)
    process.nextTick(function () {
      process.exit(exitCode)
    })
  })
})

function testTapPipe (tap) {
  tap
  .on('data', function (d) {
    buff += d
  })
}

function assertEqual (tap, x, y) {
  var name = '"' + x + '" === "' + y + '"'
  try {
    assert.equal(x, y)
    tap.pass(name)
  } catch (e) {
    tap.fail(name, e)
    exitCode = 1
  }
}
