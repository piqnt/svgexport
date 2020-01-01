/*
 * svgexport
 * Copyright (c) 2016 Ali Shakiba
 * Available under the MIT license
 * @license
 */

var path = require('path');
var fs = require('fs');
var renderImpl = require('./render');

module.exports.render = render;
module.exports.cli = cli;

function cli(args) {

  if (args.length === 1 && /.(js|json)$/i.test(args[0])) {
    render(path.resolve(process.cwd(), args.shift()), process);
    return;
  }

  if (args.length > 1) {
    render({
      input : [ args.shift() ],
      output : [ args ],
      cwd : process.cwd()
    }, process);
    return;
  }

  if (!args.length || (args.length === 1 && /(-h|--help|help)$/i.test(args[0]))) {
    try {
      console.log(fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf8')
          .match(/```usage([\s\S]*?)```/i)[1].replace(/\nsvgexport/,
          '\nUsage: svgexport').replace(/\nsvgexport/g, '\n  or:  svgexport'));
    } catch (e) {
      console.log('Off-line `svgexport` help is not available!');
    }
    return;
  }

  console.error('Error: Invalid usage!');
}

async function render(data, done) {

  var stdio = done;

  var stdout = stdio && stdio.stdout ? function(data) {
    stdio.stdout.write(data);
  } : noop;

  var stderr = stdio && stdio.stderr ? function(data) {
    stdio.stderr.write(data);
  } : noop;

  done = typeof done === 'function' ? done : function(err) {
    if (err) {
      stderr(err);
    }
  };

  var cwd;
  if (typeof data === 'string') {
    data = path.resolve(process.cwd(), data);
    cwd = path.dirname(data);
    try {
      data = require(data);
    } catch (e) {
      return done('Error: Invalid data file: ' + data + '\n');
    }
  } else {
    cwd = data.cwd || data.base || process.cwd();
  }

  if (!cwd) {
    cwd = process.cwd();
  }

  var commands = [];

  data = Array.isArray(data) ? data : [ data ];
  data.forEach(function(entry) {

    var input = entry.src || entry.input;
    var outputs = entry.dest || entry.output;

    // TODO: Use /('[^']*'|"[^"]*"|[^"'\s])/ instead of split(/\s+/)

    if (!Array.isArray(input)) {
      input = input.split(/\s+/);
    }

    if (!Array.isArray(outputs)) {
      // one string
      outputs = [ outputs.split(/\s+/) ];

    } else if (!outputs.some(function(output) {
      return Array.isArray(output);
    })) {
      // array, but not 2d array
      outputs = outputs.map(function(output) {
        return output.split(/\s+/);
      });
    }

    input[0] = path.resolve(cwd, input[0]);

    outputs.forEach(function(output) {

      output[0] = path.resolve(cwd, output[0]);

      commands.push({
        input : input,
        output : output
      });
    });
  });

  await renderImpl.renderSvg(commands, done, stdout);
}

function noop() {
}
