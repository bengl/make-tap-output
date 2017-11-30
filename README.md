# make-tap-output

![build status](https://travis-ci.org/bengl/make-tap-output.svg)

This is a simple toolkit for making TAP-compatible output.

## Usage

`make-tap-output` exports a single function, and returns a readable stream with
handy methods for generating TAP data from that stream.

It takes in an optional `opts` object. Currently there's only one possible
option, which is `count`. Setting this to a boolean enables or disables the
count number in each test result. The default is `true`.

```js
var tap = require('make-tap-output')({count: true})

tap.pipe(process.stdout)
```

Upon construction, it will immediately emit

```
TAP version 13
```

on the stream.

It has these functions:

### `#plan(num)`

```js
tap.plan(13)
// 1..13
```

### `#diag(text)`

```js
tap.diag('this is a "diagnostic" message')
// # this is a diagnostic message
```

### `#yaml(data)`

```js
tap.yaml({
  some: {
    data: {
      foo: 'bar'
    }
  },
  stuff: 1
})
//  ---
//  some:
//    data:
//      foo: bar
//  stuff: 1
//
//  ...
```

### `#result({ok, message, directive, dataObj})`

```js
tap.result({
  ok: false,
  message: 'some failing test',
  directive: 'extra info',
  dataObj: {some: {data: true}}
})
// not ok 1 some failing test # extra info
//   ---
//   some:
//     data: true
//   ...
```

### `#pass([message, [directive]])`

```js
tap.pass('foo test', 'bar')
// ok 1 foo test # bar
```

### `#fail([message, [directive, [err]]])`

```js
tap.fail('foo test', 'bar', new Error('foo fail'))
// not ok 1 foo test # bar
//   ---
//   name: Error
//   message: foo fail
//   stack: |-
//     Error: foo fail
//         <stack line 1>
//         <stack line 2>
//         <stack line 3>
//   ...
```

### `#bail([message])`

```js
tap.bail()
// Bail out!
```

```js
tap.bail('This is a bail out reason')
// Bail out! This is a bail out reason
```

### `#unbufferedSub(name)`

```js
var mySub = tap.unbufferedSub('my sub') // This is a new tap instance for you
mySub.test('foo test')
// # Subtest: my sub
//     ok 1 foo test
```
> Note: This does not "end" the subtest. For that, just use `pass` or `fail`
> above.

### `#bufferedSub(result)`

```js
var mySub = tap.bufferedSub({ ok: true, message: 'my sub' })
mySub.test('foo test')
mySub.end()
// ok 1 my sub {
//     ok 1 foo test
// }
```

## Standard?

This module, while helping to produce standard TAP version 13 output, can also
produce non-standard output, depending on how you interat with it. For example,
if you call `plan` midway through your tests, that's invalid TAP. It's up to you
the user of this module, to use it correctly.

## License

MIT License. See LICENSE.txt
