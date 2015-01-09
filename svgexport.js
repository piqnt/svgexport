if (typeof phantom !== 'undefined') {
  try {
    if (phantom.args.length !== 1) {
      console.error('Error: Invalid commands!');
      phantom.exit();
    }
    exec(JSON.parse(phantom.args[0]), function(err) {
      err && console.log(err);
      phantom.exit();
    });
  } catch (e) {
    console.error(e);
    phantom.exit();
  }
} else {
  module.exports.render = render;
  module.exports.cli = cli;
}

function cli() {
  var path = require('path');
  var fs = require('fs');

  if (process.argv.length < 3) {
    var readme = path.resolve(__dirname, 'README.md');
    readme = fs.readFileSync(readme, 'utf8');
    console.log();
    if (!readme) {
      console.log('Invalid usage, see docs!');
    } else {
      var print = 0, usage = 0;
      readme.split(/\n/).map(function(line) {
        if (print == 1 && /```/.test(line)) {
          print = 0;
        }
        if (print > 0) {
          if (/^svgexport/.test(line)) {
            if (usage == 0) {
              line = 'Usage: ' + line;
              usage = 1;
            } else if (usage == 1) {
              line = '   or: ' + line;
            }
          } else {
            usage = -1;
          }
          console.log(line);
        }
        if (/```usage/.test(line)) {
          print = 1;
        }
      });
    }
    console.log();

  } else if (process.argv.length === 3) {
    render(path.resolve(process.cwd(), process.argv[2]), function(err) {
      err && console.log(err);
    });

  } else {
    render({
      input : process.argv[2],
      output : process.argv.slice(3).join(' '),
      base : process.cwd()
    }, function(err) {
      err && console.log(err);
    });
  }
}

function render(data, done) {
  var path = require('path');

  var base;
  if (typeof data === 'string') {
    data = path.resolve(process.cwd(), data);
    base = path.dirname(data);
    try {
      data = require(data);
    } catch (e) {
      return done('Error: Unable to load ' + data);
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

  send(commands, done);
}

function send(commands, done) {
  commands = JSON.stringify(commands);
  var path = require('path');
  var execFile = require('child_process').execFile;
  var phantom = path.resolve(__dirname,
      './node_modules/phantomjs/bin/phantomjs');
  execFile(process.execPath, [ phantom, __filename, commands ], function(err,
      stdout, stderr) {
    if (stdout.length > 0)
      console.log(stdout.toString().trim());
    if (stderr.length > 0)
      console.log(stderr.toString().trim());
    done && done(err);
  });
}

function exec(commands, done) {

  var webpage = require('webpage');
  var async = require('async');

  commands = Array.isArray(commands) ? commands : [ commands ];

  async.each(commands, function(cmd, done) {
    var page = webpage.create();
    page.open(cmd.input[0], function(status) {

      if (status !== 'success') {
        var err = 'Error: Unable to load ' + cmd.input + ' (' + status + ')';
        done && done(err);
        return;
      }

      var viewbox = page.evaluate(function() {
        var el = document.documentElement;
        if (el.getAttribute('width') && el.getAttribute('height')) {
          return {
            left : 0,
            top : 0,
            width : el.width.animVal.value,
            height : el.height.animVal.value
          };
        }
        var box = el.getAttribute('viewBox') ? el.viewBox.animVal : el
            .getBBox();
        return {
          left : box.x,
          top : box.y,
          width : box.width,
          height : box.height
        };
      });

      // console.log(JSON.stringify(viewbox, null, 2));

      parse(cmd, viewbox);

      page.clipRect = cmd;
      page.zoomFactor = cmd.scale;

      if (cmd.paperWidth && cmd.paperHeight) {
        page.paperSize = {
          width : cmd.paperWidth,
          height : cmd.paperHeight
        };
      } else if (cmd.paperFormat) {
        page.paperSize = {
          format : cmd.paperFormat,
          orientation : cmd.paperOrientation
        };
      }

      setTimeout(function() {
        page.render(cmd.output[0], {
          format : cmd.format,
          quality : cmd.quality
        });
        console.log(strcmd(cmd));
        done && done();
      }, 0);
    });
  }, function(err) {
    done && done(err);
  });
}

function parse(cmd, box) {

  var params = new Params(cmd.input.join(' ') + ' ' + cmd.output.join(' '));

  cmd.scale = 1;
  cmd.format = 'png';
  cmd.quality = 100;

  params.first(/^(\d+)\%$/i, function(match) {
    cmd.quality = match[1];
  });

  params.first(/^(jpeg|jpg|pdf)$/i, function(match) {
    cmd.format = match[1];
  }, function() {
    var ext = /.(jpeg|jpg|pdf)$/.exec(cmd.output[0]);
    if (ext && ext[1]) {
      cmd.format = ext[1];
    }
  });

  cmd.format = cmd.format.toLowerCase().replace('jpg', 'jpeg');

  params.first(/^([0-9.]+(mm|cm|in|px)):([0-9.]+(mm|cm|in|px))$/i, function(
      match) {
    cmd.paperWidth = match[1];
    cmd.paperHeight = match[3];
  });

  params.first(/^(A3|A4|A5|Legal|Letter|Tabloid)$/i, function(match) {
    cmd.paperFormat = match[1];
  });

  params.first(/^(portrait|landscape)$/i, function(match) {
    cmd.paperOrientation = match[1];
  });

  params.last(/^([0-9.]+)x$/i, function(match) {
    cmd.scale = match[1];

  }) || params.last(/^(\d+)w$/i, function(match) {
    cmd.width = match[1];

  }) || params.last(/^(\d+):$/i, function(match) {
    cmd.width = match[1];

  }) || params.last(/^(\d+)h$/i, function(match) {
    cmd.height = match[1];

  }) || params.last(/^:(\d+)$/i, function(match) {
    cmd.height = match[1];

  }) || params.last(/^(\d+):(\d+)$/i, function(match) {
    cmd.width = match[1];
    cmd.height = match[2];
  });

  params.last(/^((-?\d+):(-?\d+):)?(\d+):(\d+)$/i, function(match) {
    box = {
      left : match[2] || 0,
      top : match[3] || 0,
      width : match[4],
      height : match[5]
    };
  });

  if (cmd.width && cmd.height) {
    cmd.scale = Math.max(cmd.width / box.width, cmd.height / box.height);

  } else if (cmd.width) {
    cmd.scale = cmd.width / box.width;
    cmd.height = box.height * cmd.scale;

  } else if (cmd.height) {
    cmd.scale = cmd.height / box.height;
    cmd.width = box.width * cmd.scale;

  } else {
    cmd.height = box.height * cmd.scale;
    cmd.width = box.width * cmd.scale;
  }

  cmd.left = box.left * cmd.scale + (box.width * cmd.scale - cmd.width) / 2;
  cmd.top = box.top * cmd.scale + (box.height * cmd.scale - cmd.height) / 2;

  return cmd;
}

function Params(cmd) {
  var params = cmd.split(/\s+/);

  this.first = function(regex, callback, fallback) {
    for (var i = 0; i < params.length; i++) {
      var param = params[i];
      var match = regex.exec(param);
      if (match) {
        params.splice(i--, 1);
        callback(match);
        return true;
      }
    }
    fallback && fallback();
    return false;
  };

  this.last = function(regex, callback, fallback) {
    for (var i = params.length - 1; i >= 0; i--) {
      var param = params[i];
      var match = regex.exec(param);
      if (match) {
        params.splice(i, 1);
        callback(match);
        return true;
      }
    }
    fallback && fallback();
    return false;
  };
}

function strcmd(cmd) {
  return cmd.input[0] + ' ' + cmd.output[0] + ' ' + cmd.format + ' '
      + cmd.quality + '%' + ' ' + cmd.scale + 'x' + ' '
      + strnum(cmd.left / cmd.scale) + ':' + strnum(cmd.top / cmd.scale) + ':'
      + strnum(cmd.width / cmd.scale) + ':' + strnum(cmd.height / cmd.scale)
      + ' ' + strnum(cmd.width) + ':' + strnum(cmd.height);
}

function strnum(n) {
  return (n * 100 | 0) / 100;
}