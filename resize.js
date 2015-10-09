/*
 * svgexport
 * Copyright (c) 2015 Ali Shakiba
 * Available under the MIT license
 * @license
 */

module.exports = function(input, output) {
  var resize = {};
  if (output.width && output.height) {

    var fn = (output.mode === 'pad' || output.mode === 'meet') ? Math.min
        : Math.max;
    resize.scale = fn(output.width / input.width, output.height / input.height);
    resize.width = output.width;
    resize.height = output.height;

  } else if (output.width) {
    resize.scale = output.width / input.width;
    resize.width = output.width;
    resize.height = input.height * resize.scale;

  } else if (output.height) {
    resize.scale = output.height / input.height;
    resize.width = input.width * resize.scale;
    resize.height = output.height;

  } else {
    resize.scale = output.scale || 1;
    resize.height = input.height * output.scale;
    resize.width = input.width * output.scale;
  }

  resize.left = (input.left || 0) * resize.scale
      + (input.width * resize.scale - resize.width) / 2;
  resize.top = (input.top || 0) * resize.scale
      + (input.height * resize.scale - resize.height) / 2;

  return resize;
};
