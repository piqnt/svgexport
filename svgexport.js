var webpage = null;
try {
  webpage = require('webpage');
} catch (e) {
}

if (!webpage) {

  var path = require('path');

  if (process.argv.length !== 3) {
    console.error('Usage: svgexport datafile');
    process.exit();
  }

  var data = path.resolve(process.cwd(), process.argv[2]);
  var base = path.dirname(data);
  data = require(data);

  var commands = [];

  if (!Array.isArray(data)) {
    data = [ data ];
  }
  data.forEach(function(entry) {
    if (!Array.isArray(entry.dest)) {
      entry.dest = [ entry.dest ];
    }
    entry.dest.forEach(function(dest) {
      dest = dest.split(/\s+/);
      var c = {};
      c.src = entry.src;
      c.src = path.resolve(base, c.src);
      c.file = dest.shift();
      c.file = path.resolve(base, c.file);
      c.format = /.(jpeg|jpg)$/.test(c.file) ? 'jpeg' : 'png';
      c.quality = 100;
      c.scale = 1;
      var param = dest.shift();
      var match;
      if (param && (match = /^(\d+)\%$/i.exec(param))) {
        quality = match[1];
        param = dest.shift();
      }
      if (match = /^(\d+):(\d+)$/i.exec(param)) {
        c.left = 0;
        c.top = 0;
        c.width = match[1];
        c.height = match[2];
      } else if (match = /^(\d+):(\d+):(\d+):(\d+)$/i.exec(param)) {
        c.left = match[1];
        c.top = match[2];
        c.width = match[3];
        c.height = match[4];
      } else {
        console.log("Invalid output!");
        return;
      }
      param = dest.shift();
      if (param) {
        if (match = /^(\d+)x$/i.exec(param)) {
          c.scale = match[1];
          c.left *= c.scale;
          c.top *= c.scale;
          c.width *= c.scale;
          c.height *= c.scale;
        } else if (match = /^(\d+)w$/i.exec(param)) {
          var width = match[1];
          c.scale = width / c.width;
          c.left *= c.scale;
          c.top *= c.scale;
          c.width = width;
          c.height *= c.scale;
        } else if (match = /^(\d+)h$/i.exec(param)) {
          var height = match[1];
          c.scale = height / c.height;
          c.left *= c.scale;
          c.top *= c.scale;
          c.width *= c.scale;
          c.height = height;
        } else if (match = /^(\d+):(\d+)$/i.exec(param)) {
          var height = match[1];
          var width = match[2];
          var scalex = width / c.width;
          var scaley = height / c.height;
          c.scale = Math.max(scalex, scaley);
          c.left = c.left * c.scale + (c.width * c.scale - width) / 2;
          c.top = c.top * c.scale + (c.height * c.scale - height) / 2;
          c.width = width;
          c.height = height;
        }
      }

      commands.push(c);
    });
  });

  commands = JSON.stringify(commands);

  var execFile = require('child_process').execFile;
  var phantom = path.resolve(__dirname,
      './node_modules/phantomjs/bin/phantomjs');
  execFile(process.execPath, [ phantom, __filename, commands ], function(err,
      stdout, stderr) {
    if (err) {
      console.log(err);
    } else if (stdout.length > 0) {
      console.log(stdout.toString().trim());
    } else if (stderr.length > 0) {
      console.log(stderr.toString().trim());
    }
  });

} else {

  try {
    if (phantom.args.length !== 1) {
      console.error('Error: Invalid commands!');
      phantom.exit();
    }

    var async = require('async');

    var commands = JSON.parse(phantom.args[0]);

    if (!Array.isArray(commands)) {
      commands = [ commands ];
    }

    async.each(commands, function(cmd, done) {
      var page = webpage.create();
      page.open(cmd.src, function(status) {
        if (status !== 'success') {
          console.error('Error: Unable to load ' + cmd.src + ' (' + status
              + ')');
          done();
          return;
        }

        page.clipRect = cmd;
        page.zoomFactor = cmd.scale;
        setTimeout(function() {
          page.render(cmd.file, {
            format : cmd.format,
            quality : cmd.quality
          });
          console.log(strcmd(cmd));
          done();
        }, 0);
      });
    }, function(err) {
      err && console.log(err);
      phantom.exit();
    });
  } catch (e) {
    console.error(e);
    phantom.exit();
  }
}

function strcmd(cmd) {
  return cmd.src + ' ' + cmd.file + ' ' + cmd.format + ' ' + cmd.quality + '%'
      + ' ' + cmd.scale + 'x' + ' ' + cmd.left / cmd.scale + ':'
      + cmd.top / cmd.scale + ':' + cmd.width / cmd.scale + ':'
      + cmd.height / cmd.scale + ' ' + cmd.width + ':' + cmd.height;
}