/*
 * svgexport
 * Copyright (c) 2015 Ali Shakiba
 * Available under the MIT license
 * @license
 */

module.exports.resize = resize;
module.exports.parse = parse;

// TODO: needs refactoring

function parse(box, params, outputfile) {

  params = new Params(params);

  var output = {
    toString : toString
  };

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

  params.last(/^([0-9.]+)x$/i, function(match) {
    output.scale = match[1];

  }) || params.last(/^(\d+):$/i, function(match) {
    output.width = match[1];

  }) || params.last(/^:(\d+)$/i, function(match) {
    output.height = match[1];

  }) || params.last(/^(\d+):(\d+)$/i, function(match) {
    output.width = match[1];
    output.height = match[2];
  });

  params.last(/^((-?\d+):(-?\d+):)?(\d+):(\d+)$/i, function(match) {
    box = {
      left : match[2] || 0,
      top : match[3] || 0,
      width : match[4],
      height : match[5]
    };
  });

  params.first(/^(pad|meet)$/i, function(match) {
    output.mode = 'pad';
  });

  params.first(/^([^{}]+\s*\{[^{}]*\}\s*)+$/i, function(match) {
    output.css = match[0];
  });

  resize(box, output);

  return output;
}

function resize(input, output) {
  if (output.width && output.height) {

    var fn = (output.mode === 'pad' || output.mode === 'meet') ? Math.min
        : Math.max;
    output.scale = fn(output.width / input.width, output.height / input.height);

  } else if (output.width) {
    output.scale = output.width / input.width;
    output.height = input.height * output.scale;

  } else if (output.height) {
    output.scale = output.height / input.height;
    output.width = input.width * output.scale;

  } else {
    output.height = input.height * output.scale;
    output.width = input.width * output.scale;
  }

  output.left = (input.left || 0) * output.scale
      + (input.width * output.scale - output.width) / 2;
  output.top = (input.top || 0) * output.scale
      + (input.height * output.scale - output.height) / 2;

  return output;
};

function toString() {
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