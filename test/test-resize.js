var resize = require('../resize').resize;
var should = require('should');

// TODO: rest resize.parse
it('Resize', function() {
  var output, input = {
    width : 1,
    height : 1
  };
  output = resize(input, {
    width : 5
  });
  output.width.should.equal(5);
  output.height.should.equal(5);
  output.scale.should.equal(5);

  output = resize(input, {
    width : 5,
    height : 2
  });
  output.width.should.equal(5);
  output.height.should.equal(2);
  output.scale.should.equal(5);

  output = resize(input, {
    width : 5,
    height : 2,
    mode : 'pad'
  });
  output.width.should.equal(5);
  output.height.should.equal(2);
  output.scale.should.equal(2);
});
