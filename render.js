try {
  var webpage = require('webpage');
  var async = require('async');

  if (phantom.args.length !== 1) {
    exit('Error: Invalid commands!');
  }
  exec(JSON.parse(phantom.args[0]), exit);
} catch (e) {
  exit(e);
}

function exit(err) {
  err && console.error(err);
  phantom.exit(err ? 1 : 0);
}

function exec(commands, done) {

  commands = Array.isArray(commands) ? commands : [ commands ];
  async.each(commands, function(cmd, done) {
    var page = webpage.create();
    page.open(cmd.input[0], function(status) {

      if (status !== 'success') {
        var err = 'Error: Unable to load file (' + status + '): ' + cmd.input;
        done && done(err);
        return;
      }

      try {

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
            more : el.getBBox(),
            left : box.x,
            top : box.y,
            width : box.width,
            height : box.height
          };
        });

        parse(cmd, viewbox);

        page.clipRect = cmd;
        page.zoomFactor = cmd.scale;

      } catch (e) {
        done && done(e);
      }

      setTimeout(function() {
        try {
          page.render(cmd.output[0], {
            format : cmd.format,
            quality : cmd.quality
          });
          console.log(strcmd(cmd));
          done && done();
        } catch (e) {
          done && done(e);
        }
      }, 0);
    });
  }, function(err) {
    done && done(err);
  });
}

function parse(cmd, box) {

  var params = new Params([].concat(cmd.input, cmd.output));

  cmd.scale = 1;
  cmd.format = 'png';
  cmd.quality = 100;

  params.first(/^(\d+)\%$/i, function(match) {
    cmd.quality = match[1];
  });

  params.first(/^(jpeg|jpg)$/i, function(match) {
    cmd.format = match[1];
  }, function() {
    var ext = /.(jpeg|jpg)$/.exec(cmd.output[0]);
    if (ext && ext[1]) {
      cmd.format = ext[1];
    }
  });

  cmd.format = cmd.format.toLowerCase().replace('jpg', 'jpeg');

  params.last(/^([0-9.]+)x$/i, function(match) {
    cmd.scale = match[1];

  }) || params.last(/^(\d+):$/i, function(match) {
    cmd.width = match[1];

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

function Params(params) {

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