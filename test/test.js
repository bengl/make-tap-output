const makeTap = require('../index');
const fs = require('fs');
const assert = require('assert');

let testOutput = fs.readFileSync(require('path').join(__dirname, 'test1.tap'), 'utf8');
let buff = '';
let exitCode = 0;

const testErr = {
  name: 'Error',
  message: 'foobar',
  stack: 'Error: foobar\n    at line1\n    at line2'
};

const testAssertionError = {
  name: 'AssertionError',
  message: 'foomessage',
  operator: '==',
  expected: 'five',
  actual: {
    some: 'thing',
    with: [
      {
        an: undefined,
        and: null,
        also: Symbol('symbol')
      }
    ]
  },
  stack: 'AssertionError: foomessage\n    at line1\n    at line2'
};

const testTap = makeTap();

testTap.writeln('# foo');

testTap.diag('bar');

testTap.plan(8);

testTap.pass();
testTap.pass('foo');
testTap.pass('bar', 'thing');

testTap.fail(testErr);
testTap.fail('foo', testErr);
testTap.fail('bar', 'thing', testAssertionError);
testTap.fail({ name: 'not a real error' });

testTap.bail();
testTap.bail('This is a bail reason');

testTap.yaml({
  some: {
    data: {
      foo: 'bar'
    }
  },
  stuff: 1
});

const sub1 = testTap.unbufferedSub('sub1');
sub1.plan(3);
sub1.pass('a pass');
sub1.fail('a fail', testErr);
const subsub1 = sub1.unbufferedSub('subsub1');
subsub1.plan(1);
subsub1.pass('a pass');
sub1.pass('subsub1');
testTap.pass('sub1');

const sub2 = testTap.bufferedSub({ ok: true, message: 'sub2' });
sub1.plan(2);
sub2.pass('a pass');
sub2.fail('a fail', testErr);
const subsub2 = sub2.bufferedSub({ ok: true, message: 'subsub2' });
subsub2.plan(1);
subsub2.pass('a pass');
subsub2.end();
sub2.pass('subsub2');
sub2.end();

testTap.end();

const testTap2 = makeTap({ count: false });

testTap2.pass();
testTap2.pass('foo');

testTap2.end();

testTapPipe(testTap);
testTapPipe(testTap2);
testTap2.on('end', function () {
  process.nextTick(function () {
    const mainTap = makeTap();
    testOutput = testOutput.split('\n');
    buff = buff.split('\n');
    mainTap.plan(testOutput.length);
    assertEqual(mainTap, testOutput.length, buff.length);
    testOutput.forEach(function (line, i) {
      assertEqual(mainTap, line, buff[i]);
    });
    mainTap.end();
    mainTap.pipe(process.stdout);
    process.nextTick(function () {
      process.exit(exitCode);
    });
  });
});

function testTapPipe (tap) {
  tap.on('data', function (d) {
    buff += d;
  });
}

function assertEqual (tap, x, y) {
  const name = '"' + x + '" === "' + y + '"';
  try {
    assert.strictEqual(x, y);
    tap.pass(name);
  } catch (e) {
    tap.fail(name, e);
    exitCode = 1;
  }
}
