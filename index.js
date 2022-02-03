/*
Copyright 2015, Yahoo Inc. All rights reserved.
Code licensed under the MIT License.
See LICENSE.txt
*/
const yaml = require('js-yaml');
const { Transform } = require('readable-stream');

const BAIL = 'Bail out!';

class MakeTap extends Transform {
  constructor (opts) {
    super();
    opts = opts || {};
    this.opts = opts;
    this.countEnabled = typeof opts.count !== 'boolean' ? true : opts.count;
    if (!opts.noversion) {
      this.writeln('TAP version 13');
    }
    this.count = 0;
  }

  _transform (data, encoding, callback) {
    callback(null, data);
  }

  writeln (data) {
    this.write(data + '\n');
  }

  diag (data) {
    this.writeln(data.split('\n').map(l => `# ${l}`).join('\n'));
  }

  plan (num) {
    this.writeln('1..' + num);
  }

  pass (message, directive) {
    this.result({ message: message, ok: true, directive: directive });
  }

  fail (message, directive, err) {
    if (arguments.length === 2 && typeof directive !== 'string') {
      err = directive;
      directive = undefined;
    }
    if (arguments.length === 1 && typeof message !== 'string') {
      err = message;
      message = undefined;
      directive = undefined;
    }
    this.result({ message: message, directive: directive });
    this.yaml(processError(err));
  }

  bail (message) {
    this.writeln(message && message.length ? BAIL + ' ' + message : BAIL);
  }

  result (result) {
    const line = [(result.ok ? 'ok' : 'not ok')];
    if (this.countEnabled) line.push(++this.count);
    if (result.message) line.push(result.message);
    if (result.directive) line.push('# ' + result.directive);
    this.writeln(line.join(' '));
    if (typeof result.dataObj === 'object') {
      this.yaml(result.dataObj);
    }
  }

  yaml (data) {
    this.writeln('  ---');
    this.writeln(
      yaml.dump(data, { skipInvalid: true })
        .split('\n')
        .map(l => l.length ? '  ' + l : '')
        .join('\n')
    );
    this.writeln('  ...');
  }

  unbufferedSub (name) {
    this.writeln('# Subtest: ' + name);
    const opts = {};
    for (const prop in this.opts) {
      opts[prop] = this.opts[prop];
    }
    opts.noversion = true;
    const subtap = new MakeTap(opts);
    subtap.writeln = data =>
      this.writeln(data.split('\n').map(l => '    ' + l).join('\n'));
    return subtap;
  }

  bufferedSub (result) {
    const line = [(result.ok ? 'ok' : 'not ok')];
    if (this.countEnabled) line.push(++this.count);
    if (result.message) line.push(result.message);
    if (result.directive) line.push('# ' + result.directive);
    this.writeln(line.join(' ') + ' {');
    const opts = {};
    for (const prop in this.opts) {
      opts[prop] = this.opts[prop];
    }
    opts.noversion = true;
    const subtap = new MakeTap(opts);
    subtap.writeln = data =>
      this.writeln(data.split('\n').map(l => '    ' + l).join('\n'));
    subtap.end = () => this.writeln('}');
    return subtap;
  }
}

module.exports = opts => new MakeTap(opts);

function processError (err) {
  const obj = {};
  applyProp(err, obj, 'name');
  applyProp(err, obj, 'message');
  if (err.name && err.name.indexOf('AssertionError') === 0) {
    applyProp(err, obj, 'operator');
    applyProp(err, obj, 'expected');
    applyProp(err, obj, 'actual');
  }
  if (err.stack) {
    const stack = err.stack.split('\n');
    stack.shift();
    obj.stack = stack.map(line => line.replace('    at ', '')).join('\n');
  }
  return obj;
}

function applyProp (from, to, name) {
  if (from[name]) to[name] = from[name];
}
