## svgexport

svgexport is a command-line utility for exporting SVG files to PNG/JPEG images using Node.js and PhantomJS.

#### Installation
```
npm install svgexport -g
```

#### Usage

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

If <output size> is specified as <width>:<height> and its aspect ratio doesn't match <input viewbox>, it will be centered.
```
