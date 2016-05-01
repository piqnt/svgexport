/*
 * svgexport
 * Copyright (c) 2016 Ali Shakiba
 * Available under the MIT license
 * @license
 */

try {
  var webpage = require('webpage');
  var async = require('async');
  var system = require('system');
  var resize = require('./resize');

  if (system.args.length !== 2) {
    exit('Error: Invalid commands!');
  }

  exec(JSON.parse(system.args[1]), exit);
} catch (e) {
  exit(e);
}

function exit(err) {
  err && system.stderr.writeLine(err);
  phantom.exit(err ? 1 : 0);
}

function exec(commands, done) {
  // Make sure the commands var is an array.
  commands = Array.isArray(commands) ? commands : [ commands ];

  // Run each command in parallel.
  async.each(commands, function(cmd, done) {
    var page = webpage.create();
    try {
      var svgfile = cmd.input[0];
      var imgfile = cmd.output[0];
      var params = [].concat(cmd.input.slice(1), cmd.output.slice(1));
    } catch (e) {
      done && done(e);
      return;
    }
    page.open(svgfile, function(status) {
      if (status !== 'success') {
        var err = 'Error: Unable to load file (' + status + '): ' + svgfile;
        done && done(err);
        return;
      }
      try {
        var input = page.evaluate(function() {
          var el = document.documentElement;
          var widthAttr = el.getAttribute('width');
          var heightAttr = el.getAttribute('height');
          var viewBoxAttr = el.getAttribute('viewBox');
          if (widthAttr && heightAttr && !/\%\s*$/.test(widthAttr)
              && !/\%\s*$/.test(heightAttr)) {
            return {
              size : true,
              left : 0,
              top : 0,
              width : el.width.animVal.value,
              height : el.height.animVal.value
            };
          } else if (viewBoxAttr && el.viewBox) {
            return {
              viewbox : true,
              left : el.viewBox.animVal.x,
              top : el.viewBox.animVal.y,
              width : el.viewBox.animVal.width,
              height : el.viewBox.animVal.height
            };
          } else {
            var box = el.getBBox();
            return {
              bbox : true,
              left : box.x,
              top : box.y,
              width : box.width,
              height : box.height
            };
          }
        });

        var output = new Command(input, params, imgfile);

        // system.stderr.writeLine(JSON.stringify(output));
        // system.stderr.writeLine(JSON.stringify(input));

        if (output.css) {
          injectCSS(page, output.css);
        }

        if (input.viewbox) {
          // set viewport size
          page.viewportSize = {
            width : input.width * output.scale,
            height : input.height * output.scale
          };

          page.clipRect = {
            width : output.width,
            height : output.height,
            left : output.left - input.left * output.scale,
            top : output.top - input.top * output.scale
          };

          // scaled by viewbox
          page.zoomFactor = 1;
        } else {
          page.clipRect = output;
          page.zoomFactor = output.scale;
        }
      } catch (e) {
        done && done(e);
        return;
      }
      setTimeout(function() {
        try {
          page.render(imgfile, {
            format : output.format,
            quality : output.quality
          });
          system.stdout.writeLine(svgfile + ' ' + imgfile + ' '
              + output.toString());
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

function injectCSS(page, css) {
  page.evaluate(function(css) {
    var ns = "http://www.w3.org/2000/svg";
    var style = document.createElementNS(ns, "style");
    style.setAttribute('type', 'text/css');
    style.appendChild(document.createCDATASection(css));
    var svg = document.documentElement;
    svg.insertBefore(style, svg.firstChild);
  }, css);
}

function Command(input, params, outputfile) {

  params = new Params(params);

  var output = this;

  output.scale = 1;
  output.format = 'png';
  output.quality = 100;
  output.mode = 'crop'; // slice

  params.first(/^(\d+)\%$/i, function(match) {
    output.quality = match[1];
  });

  params.first(/^(jpeg|jpg)$/i, function(match) {
    output.format = match[1];
  }, function() {
    if (outputfile) {
      var ext = /.(jpeg|jpg)$/.exec(outputfile);
      if (ext && ext[1]) {
        output.format = ext[1];
      }
    }
  });

  output.format = output.format.toLowerCase().replace('jpg', 'jpeg');

  // output
  params.last(/^([0-9.]+)x$/i, function(match) {
    // <scale>x
    output.scale = match[1];

  }) || params.last(/^(\d+):$/i, function(match) {
    // <width>:
    output.width = match[1];

  }) || params.last(/^:(\d+)$/i, function(match) {
    // :<height>
    output.height = match[1];

  }) || params.last(/^(\d+):(\d+)$/i, function(match) {
    // <width>:<height>
    output.width = match[1];
    output.height = match[2];
  });

  // input
  params.last(/^((-?\d+):(-?\d+):)?(\d+):(\d+)$/i, function(match) {
    input = {
      left : match[2] || 0,
      top : match[3] || 0,
      width : match[4],
      height : match[5]
    };
  });

  // crop mode
  params.first(/^(pad|meet)$/i, function(match) {
    output.mode = 'pad';
  });

  // css style
  params.first(/^([^{}]+\s*\{[^{}]*\}\s*)+$/i, function(match) {
    output.css = match[0];
  });

  var resized = resize(input, output);
  this.scale = resized.scale;
  this.width = resized.width;
  this.height = resized.height;
  this.left = resized.left;
  this.top = resized.top;
}

Command.prototype.toString = function() {
  return this.format + ' ' + this.quality + '%' + ' ' + this.scale + 'x' + ' '
      + strnum(this.left / this.scale) + ':' + strnum(this.top / this.scale)
      + ':' + strnum(this.width / this.scale) + ':'
      + strnum(this.height / this.scale) + ' ' + strnum(this.width) + ':'
      + strnum(this.height);
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

function strnum(n) {
  return (n * 100 | 0) / 100;
}
