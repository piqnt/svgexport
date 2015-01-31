var path = require('path');
var fs = require('fs');
var child_process = require('child_process');

module.exports.render = render;
module.exports.cli = cli;

function cli(args) {

  if (args.length === 1 && /.(js|json)$/i.test(args[0])) {
    render(path.resolve(process.cwd(), args.shift()), error);
    return;
  }

  if (args.length > 1) {
    render({
      input : args.shift(),
      output : args.join(' '),
      base : process.cwd()
    }, error);
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

  error('Error: Invalid usage!');

  function error(err) {
    err && console.error(err);
  }
}

function render(data, done) {

  var base;
  if (typeof data === 'string') {
    data = path.resolve(process.cwd(), data);
    base = path.dirname(data);
    try {
      data = require(data);
    } catch (e) {
      return done('Error: Invalid data file: ' + data);
    }
  } else {
    base = data.base || process.cwd();
  }

  if (!base) {
    base = process.cwd();
  }

  var commands = [];

  data = Array.isArray(data) ? data : [ data ];
  data.forEach(function(entry) {

    var input = entry.src || entry.input;
    var outputs = entry.dest || entry.output;

    input = input.split(/\s+/);
    input[0] = path.resolve(base, input[0]);

    outputs = Array.isArray(outputs) ? outputs : [ outputs ];
    outputs.forEach(function(output) {

      output = output.split(/\s+/);
      output[0] = path.resolve(base, output[0]);

      commands.push({
        input : input,
        output : output
      });
    });
  });

  commands = JSON.stringify(commands);
  var phantomjs = path.resolve(__dirname,
      'node_modules/phantomjs/bin/phantomjs');
  var renderjs = path.resolve(__dirname, 'render.js');
  child_process.spawn(phantomjs, [ renderjs, commands ], {
    stdio : 'inherit'
  });
}