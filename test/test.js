var fs = require('fs');
var p = require('path');
var should = require('should');
var child_process = require('child_process');
var svgexport = require('../');

// TODO: compare exported files

describe('Module', function() {
  this.timeout(5000);
  // TODO: test input array, and 2d output array
  it('missing svg', function(done) {
    svgexport.render({
      "input" : resolve('missing.svg'),
      "output" : resolve('exported', 'missing.png')
    }, function(err) {
      err.should.match(output.invalidsvg);
      done();
    });
  });
  it('invalid data file', function(done) {
    svgexport.render(resolve('missing.json'), function(err) {
      err.should.match(output.invaliddata);
      done();
    });
  });
  it('test.svg', function(done) {
    svgexport.render({
      "input" : resolve('test.svg'),
      "output" : resolve('exported', 'test.png')
    }, function(err) {
      err.should.not.be.ok;
      done();
    });
  });
  it('test.json', function(done) {
    svgexport.render(resolve('test.json'), function(err) {
      err.should.not.be.ok;
      done();
    });
  });
});

describe('CLI', function() {
  this.timeout(5000);
  // TODO: test input/output path with space
  it('no arg', function(done) {
    cli([], {
      stderr : /^$/,
      stdout : output.help,
      done : done
    });
  });
  it('help', function(done) {
    cli([ 'help' ], {
      stderr : /^$/,
      stdout : output.help,
      done : done
    });
  });
  it('--help', function(done) {
    cli([ '--help' ], {
      stderr : /^$/,
      stdout : output.help,
      done : done
    });
  });
  it('-h', function(done) {
    cli([ '-h' ], {
      stderr : /^$/,
      stdout : output.help,
      done : done
    });
  });
  it('invalid args', function(done) {
    cli([ 'invalid' ], {
      stderr : output.invalidargs,
      stdout : /^$/,
      done : done
    });
  });
  it('missing svg', function(done) {
    cli([ 'missing.svg', p.join('exported', 'missing.png') ], {
      stderr : output.invalidsvg,
      stdout : /^$/,
      done : done
    });
  });
  it('invalid data file', function(done) {
    cli([ 'missing.json' ], {
      stderr : output.invaliddata,
      stdout : /^$/,
      done : done
    });
  });
  it('test.svg', function(done) {
    cli([ 'test.svg', p.join('exported', 'test.png') ], {
      stderr : /^$/,
      stdout : output.testsvg,
      done : done
    });
  });
  it('test.json', function(done) {
    cli([ 'test.json' ], {
      stderr : /^$/,
      stdout : output.testjson,
      done : done
    });
  });
});

function cli(args, done) {
  child_process.execFile(resolve('..', 'bin', 'index.js'), args, {
    cwd : __dirname
  }, function(err, stdout, stderr) {
    if (!err) {
      done.stderr && stderr.toString().should.match(done.stderr);
      done.stdout && stdout.toString().should.match(done.stdout);
    }
    done.done && done.done(err);
  });
}

function resolve() {
  return p.resolve(__dirname, p.join.apply(p, arguments));
}

var output = {
  help : /^\sUsage:/,
  invalidargs : /^Error: Invalid usage!\n?$/,
  invalidsvg : /^Error: Unable to load file \(fail\): .*missing\.svg\n?$/,
  invaliddata : /^Error: Invalid data file: .*missing\.json\n?$/,
  testsvg : /^.*test.svg .*test.png png 100% 1x 0:0:16:16 16:16\n?$/,
  testjson : new RegExp(".*test.svg .*32h.png png 100% 2x 0:0:16:16 32:32\n"
      + ".*test.svg .*32w.png png 100% 2x 0:0:16:16 32:32\n"
      + ".*test.svg .*2.5x16.png png 100% 2.5x 0:0:16:16 40:40\n"
      + ".*test.svg .*16-16.png png 100% 1x 0:0:16:16 16:16\n"
      + ".*test.svg .*32-32.png png 100% 2x 0:0:16:16 32:32\n"
      + ".*test.svg .*64-32.png png 100% 4x 0:4:16:8 64:32\n"
      + ".*test.svg .*32-64.png png 100% 4x 4:0:8:16 32:64\n"
      + ".*test.svg .*64-32-pad.png png 100% 2x -8:0:32:16 64:32\n"
      + ".*test.svg .*32-64-pad.png png 100% 2x 0:-8:16:32 32:64\n"
      + ".*test.svg .*offset.png png 100% 4x 8:8:8:8 32:32\n"
      + ".*test.svg .*jpeg-low.jpg jpeg 1% 20x 0:0:16:16 320:320\n"
      + ".*test.svg .*jpeg-high.jpg jpeg 99% 20x 0:0:16:16 320:320\n"
      + ".*test.svg .*36h.png png 100% 2x -1:-1:18:18 36:36\n"
      + ".*test.svg .*36w.png png 100% 2x -1:-1:18:18 36:36\n"
      + ".*test.svg .*2.5x18.png png 100% 2.5x -1:-1:18:18 45:45\n"
      + ".*test.svg .*18-18.png png 100% 1x -1:-1:18:18 18:18\n")
};