## svgexport

svgexport is a command-line utility and Node.js module for exporting SVG files to PNG and JPEG. It uses PhantomJS for rendering SVG files.

#### Node Module

Installation
```
npm install svgexport --save
```

Usage

```javascript
var svgexport = require('svgexport');

svgexport.render(datafile, callback);
```
See command line usage for datafile content, it can be an object/array or a json file path with similar content.

#### Command Line

Installation
```
npm install svgexport -g
```

Usage
```usage
svgexport <datafile>
svgexport <input file> <output file> [<format>] [<quality>%] <input viewbox> [<output size>]

<format>:         png|jpeg|jpg
<quality>:        1-100
<input viewbox>:  [<left>:<top>:]<width>:<height>
<output size>:    <scale>x|<width>w|<height>h|<width>:<height>

<datafile> content:
    [ {
        "input" : "<input file> <input viewbox>",
        "output": [
            "<output file> [<format>] [<quality>%] <input viewbox> [output size]",
            ...
        ]
    }, ...]

<input viewbox> is required only once and the last one is effective.

If <format> is missing, it will be inferred from <output file> extension or defaults to png.

If <output size> is specified as <width>:<height> and its aspect ratio doesn't match <input viewbox>, viewbox will be centered and cropped.
```

#### Keywords
svg, export, rasterize, converter, png, jpeg, jpg, pdf, cli, command-line, inkscape, illustrator, coreldraw
