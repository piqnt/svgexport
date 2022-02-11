var fs = require('fs');
var p = require('path');
var expect = require('expect.js');
var child_process = require('child_process');
var svgexport = require('../');

// TODO: compare exported files

describe('Module', function() {
  this.timeout(5000);
  // TODO: test input array, and 2d output array
  it('missing svg', function(done) {
    svgexport.render({
      'input' : resolve('missing.svg'),
      'output' : resolve('exported', 'missing.png')
    }, function(err) {
      expect(err).match(output.invalidsvg);
      done();
    });
  });
  it('invalid data file', function(done) {
    svgexport.render(resolve('missing.json'), function(err) {
      expect(err).match(output.invaliddata);
      done();
    });
  });
  it('simple.svg', function(done) {
    svgexport.render({
      'input' : resolve('svg/simple.svg'),
      'output' : resolve('exported', 'test.png')
    }, function(err) {
      expect(err).not.be.ok;
      done();
    });
  });
  it('trans.svg data url', function(done) {
    svgexport.render({
      'input' : "data:image/svg+xml;charset=UTF-8,%3c?xml version='1.0' encoding='UTF-8' standalone='no'?%3e%3csvg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' version='1.1' width='16' height='16'%3e%3crect width='12' height='2' x='2' y='0' style='fill:red;fill-opacity:1;stroke:none' /%3e%3crect width='12' height='2' x='2' y='14' style='fill:green;fill-opacity:1;stroke:none' /%3e%3crect width='2' height='12' x='0' y='2' style='fill:blue;fill-opacity:1;stroke:none' /%3e%3crect width='2' height='12' x='14' y='2' style='fill:yellow;fill-opacity:1;stroke:none' /%3e%3crect width='2' height='2' x='7' y='7' style='fill:gray;fill-opacity:1;stroke:none' /%3e%3crect width='1' height='1' x='7.5' y='7.5' style='fill:white;fill-opacity:1;stroke:none' /%3e%3c/svg%3e",
      'output' : resolve('exported', 'trans-svg-from-data-url.png')
    }, function(err) {
      expect(err).not.be.ok;
      done();
    });
  });
  it('test.json', function(done) {
    svgexport.render(resolve('test.json'), function(err) {
      expect(err).not.be.ok;
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
  it('simple.svg', function(done) {
    cli([ 'svg/simple.svg', p.join('exported', 'test.png') ], {
      stderr : /^$/,
      done : function(err, stdout, stderr) {
        if (!err) {
          expect(stdout.split(resolve('')).join('')).eql(output.testsvg);
        }
        done(err);
      }
    });
  });
  it('test.json', function(done) {
    cli([ 'test.json' ], {
      stderr : /^$/,
      done : function(err, stdout, stderr) {
        if (!err) {
          expect(stdout.split(resolve('')).join('').split('\n').sort()).eql(
              output.testjson.split('\n').sort());
        }
        done(err);
      }
    });
  });
});

function cli(args, done) {
  child_process.execFile(resolve('..', 'bin', 'index.js'), args, {
    cwd : __dirname
  }, function(err, stdout, stderr) {
    if (!err) {
      stdout = stdout.toString();
      stderr = stderr.toString();
      done.stdout && expect(stdout).match(done.stdout);
      done.stderr && expect(stderr).match(done.stderr);
    }
    done.done && done.done(err, stdout, stderr);
  });
}

function resolve() {
  return p.resolve(__dirname, p.join.apply(p, arguments));
}

var output = {
  help : /^\sUsage:/,
  invalidargs : /^Error: Invalid usage!\n?$/,
  invalidsvg : /^Error: Unable to load file \(Error: net::ERR_FILE_NOT_FOUND at .*missing\.svg\): .*missing\.svg\n*$/,
  invaliddata : /^Error: Invalid data file: .*missing\.json\n*$/,
  testsvg : '/svg/simple.svg /exported/test.png png 100% 1x 0:0:16:16 16:16\n',
  testjson : '/svg/simple.svg /exported/32h.png png 100% 2x 0:0:16:16 32:32\n'
      + '/svg/simple.svg /exported/32w.png png 100% 2x 0:0:16:16 32:32\n'
      + '/svg/simple.svg /exported/2.5x16.png png 100% 2.5x 0:0:16:16 40:40\n'
      + '/svg/simple.svg /exported/16-16.png png 100% 1x 0:0:16:16 16:16\n'
      + '/svg/simple.svg /exported/32-32.png png 100% 2x 0:0:16:16 32:32\n'
      + '/svg/simple.svg /exported/64-32.png png 100% 4x 0:4:16:8 64:32\n'
      + '/svg/simple.svg /exported/32-64.png png 100% 4x 4:0:8:16 32:64\n'
      + '/svg/simple.svg /exported/64-32-pad.png png 100% 2x -8:0:32:16 64:32\n'
      + '/svg/simple.svg /exported/32-64-pad.png png 100% 2x 0:-8:16:32 32:64\n'
      + '/svg/simple.svg /exported/offset.png png 100% 4x 8:8:8:8 32:32\n'
      + '/svg/simple.svg /exported/jpeg-low.jpg jpeg 1% 20x 0:0:16:16 320:320\n'
      + '/svg/simple.svg /exported/jpeg-high.jpg jpeg 99% 20x 0:0:16:16 320:320\n'
      + '/svg/simple.svg /exported/36h.png png 100% 2x -1:-1:18:18 36:36\n'
      + '/svg/simple.svg /exported/36w.png png 100% 2x -1:-1:18:18 36:36\n'
      + '/svg/simple.svg /exported/2.5x18.png png 100% 2.5x -1:-1:18:18 45:45\n'
      + '/svg/simple.svg /exported/18-18.png png 100% 1x -1:-1:18:18 18:18\n'
      + '/svg/viewbox.svg /exported/36h-vb.png png 100% 2x -1:-1:18:18 36:36\n'
      + '/svg/viewbox.svg /exported/36w-vb.png png 100% 2x -1:-1:18:18 36:36\n'
      + '/svg/viewbox.svg /exported/2.5x18-vb.png png 100% 2.5x -1:-1:18:18 45:45\n'
      + '/svg/viewbox.svg /exported/18-18-vb.png png 100% 1x -1:-1:18:18 18:18\n'
      + '/svg/viewbox-with-width-height.svg /exported/36h-vb-wh.png png 100% 0.9x 0:0:40:40 36:36\n'
      + '/svg/viewbox-with-width-height.svg /exported/36w-vb-wh.png png 100% 0.9x 0:0:40:40 36:36\n'
      + '/svg/viewbox-with-width-height.svg /exported/2.5x40-vb-wh.png png 100% 2.5x 0:0:40:40 100:100\n'
      + '/svg/viewbox-with-width-height.svg /exported/40-40-vb-wh.png png 100% 1x 0:0:40:40 40:40\n'
};
