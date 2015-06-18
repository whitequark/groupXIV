GroupXIV
========

GroupXIV is a microphotography viewer based on [Leaflet](http://leaflet.com). It allows to cut an arbitrarily large image into tiles, conveniently display them on a desktop or mobile browser, create persistent URLs, and measure distances and areas.

For example, see [Atmel ATmega8](http://groupxiv.whitequark.org/#url=data/atmega8.png.json), [Atmel ATtiny24V](http://groupxiv.whitequark.org/#url=data/attiny24v.png.json), [Epson S1D15719](http://groupxiv.whitequark.org/#url=data/S1D15719.png.json).

Requirements
------------

The tile cutter depends on [Python 3](https://python.org/) and [wand](http://docs.wand-py.org/en/).

The viewer has no server-side code, so it will work with any webserver.

Deployment
----------

Serve the `public_html` folder from any convenient URL.

Adding tiles
------------

  1. Assuming an image called `image.png`, put `image.png` in `public_html/data`.
  2. Run `python -m tile_cutter public_html/data/image.png` from the repository root. This will create:
      * `public_html/data/image.png-tiles`, containing the sliced image;
      * `public_html/data/image.png.json`, containing the image metadata.
  3. Change the following metadata fields:
      * `name` to describe the source of the image, e.g. `"Atmel ATmega8"`;
      * `scale` to contain the ratio of pixels to nanometers, e.g. `540` for 540 nanometers per pixel.
  4. Assuming `public_html` is served from `https://groupxiv/`, navigate to `https://groupxiv/#url=data/image.png.json`.

The original `image.png` is no longer necessary, however it is recommended to keep it for anyone who would like to download the source of the tileset.

Future improvements
-------------------

As soon as I have a setup for capturing multi-layer imagery, I plan to add multi-layer support. The JSON metadata format already supports it somewhat.

See also
--------

GroupXIV uses two Leaflet controls developed specifically for it: [Leaflet.Nanoscale](https://github.com/whitequark/Leaflet.Nanoscale) and [Leaflet.Nanomeasure](https://github.com/whitequark/Leaflet.Nanomeasure).

License
-------

[MIT license](LICENSE.txt)
