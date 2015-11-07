# make-tap-output

This is a simple toolkit for making TAP-compatible output.

## Usage

`make-tap-output` exports a single function, and returns a readable stream with
handy methods for generating TAP data from that stream.

```js
var tap = require('make-tap-output')()

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

## License

MIT License. See LICENSE.txt
