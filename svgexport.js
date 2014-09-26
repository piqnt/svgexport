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
  module.exports.exec = send;
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
      console.log('Usage:');
      var print = 0;
      readme.split(/\n/).map(function(line) {
        if (print == 1 && /```/.test(line)) {
          print = false;
        }
        (print == 1) && console.log('    ' + line);
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
    input = {
      file : /^\S+/.exec(input)[0],
      params : input
    };

    var outputs = entry.dest || entry.output;
    outputs = Array.isArray(outputs) ? outputs : [ outputs ];
    outputs.forEach(function(output) {

      output = {
        file : /^\S+/.exec(output)[0],
        params : output
      };

      var cmd = {
        input : path.resolve(base, input.file),
        scale : 1,
        format : 'png',
        quality : 100
      };

      cmd.output = path.resolve(base, output.file);

      var params = new Params(input.params + ' ' + output.params);

      params.first(/^(\d+)\%$/i, function(match) {
        cmd.quality = match[1];
      });

      params.first(/^(jpeg|jpg|pdf)$/i, function(match) {
        cmd.format = match[1];
      }, function() {
        var ext = /.(jpeg|jpg|pdf)$/.exec(cmd.output);
        if (ext && ext[1]) {
          cmd.format = ext[1];
        }
      });

      cmd.format = cmd.format.toLowerCase().replace('jpg', 'jpeg');

      params.last(/^(\d+):(\d+)$/i, function(match) {
        cmd.left = 0;
        cmd.top = 0;
        cmd.width = match[1];
        cmd.height = match[2];
      });

      params.last(/^((\d+):(\d+):)?(\d+):(\d+)$/i, function(match) {
        var left = match[2] || 0;
        var top = match[3] || 0;
        var width = match[4];
        var height = match[5];

        var scalex = cmd.width / width;
        var scaley = cmd.height / height;
        cmd.scale = Math.max(scalex, scaley);
        cmd.left = left * cmd.scale + (width * cmd.scale - cmd.width) / 2;
        cmd.top = top * cmd.scale + (height * cmd.scale - cmd.height) / 2;

      }) || params.last(/^(\d+)x$/i, function(match) {
        cmd.scale = match[1];
        cmd.left *= cmd.scale;
        cmd.top *= cmd.scale;
        cmd.width *= cmd.scale;
        cmd.height *= cmd.scale;

      }) || params.last(/^(\d+)w$/i, function(match) {
        var width = match[1];
        cmd.scale = width / cmd.width;
        cmd.left *= cmd.scale;
        cmd.top *= cmd.scale;
        cmd.width = width;
        cmd.height *= cmd.scale;

      }) || params.last(/^(\d+)h$/i, function(match) {
        var height = match[1];
        cmd.scale = height / cmd.height;
        cmd.left *= cmd.scale;
        cmd.top *= cmd.scale;
        cmd.width *= cmd.scale;
        cmd.height = height;

      });

      commands.push(cmd);
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
    page.open(cmd.input, function(status) {
      if (status !== 'success') {
        var err = 'Error: Unable to load ' + cmd.input + ' (' + status + ')';
        done && done(err);
        return;
      }

      page.clipRect = cmd;
      page.zoomFactor = cmd.scale;
      page.paperSize = {
        width : cmd.width / 150 + 'in',
        height : cmd.height / 150 + 'in'
      };

      setTimeout(function() {
        page.render(cmd.output, {
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

function Params(cmd) {
  var params = cmd.split(/\s+/);

  this.first = function(regex, callback, fallback) {
    for (var i = 0; i < params.length; i++) {
      var param = params[i];
      var match = regex.exec(param);
      if (match) {
        if (!callback(match)) {
          params.splice(i, 1);
          i--;
        }
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
        if (!callback(match)) {
          params.splice(i, 1);
        }
        return true;
      }
    }
    fallback && fallback();
    return false;
  };
}

function strcmd(cmd) {
  return cmd.input + ' ' + cmd.output + ' ' + cmd.format + ' ' + cmd.quality
      + '%' + ' ' + cmd.scale + 'x' + ' ' + cmd.left / cmd.scale + ':'
      + cmd.top / cmd.scale + ':' + cmd.width / cmd.scale + ':'
      + cmd.height / cmd.scale + ' ' + cmd.width + ':' + cmd.height;
}