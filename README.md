GroupXIV
========

GroupXIV is a microphotography viewer based on [Leaflet](http://leaflet.com). It allows to cut an arbitrarily large image into tiles, conveniently display them on a desktop or mobile browser, create persistent URLs, and measure distances and areas.

For example, see [Atmel ATmega8](http://groupxiv.whitequark.org/#url=data/atmega8.png.json), [Atmel ATtiny24V](http://groupxiv.whitequark.org/#url=data/attiny24v.png.json), [Epson S1D15719](http://groupxiv.whitequark.org/#url=data/S1D15719.png.json).

Requirements
------------

The tile cutter depends on [Python 3](https://python.org/) and [wand](http://docs.wand-py.org/en/).

The viewer has no server-side code, so it will work with any webserver.

Deploying
---------

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

Bonus: microphotography tips
----------------------------

  * Image stitching software can mitigate a reasonable amount of out-of-focus pixels; even 30% usually produces tolerable results as long as every area is in focus at least once.
  * If your imaging setup consistently produces out-of-focus pixels in the same regions, it's best to cut them out, e.g. using ImageMagick: `for i in raw*.png; do convert $i cropped-$i -crop WxH+X+Y`.
  * Image stitching software can mitigate a substantial difference in exposure, but it is instead recommended to keep exposure constant during capture. A good idea is to find an area where a low-reflectivity area, such as many thin metal interconnect traces, is immediately adjacent to a high-reflectivity area, such as a metal polygon, and adjust exposure so that neither is under- or overexposed.

Bonus: image stitching with Hugin
---------------------------------

[Hugin](http://hugin.sourceforge.net/) is a very powerful application for stitching images, however its intended domain is panoramas and the UI does not make it easy to stitch flat tiles. Here is a step-by-step guide:

  1. Select _Interface_ → _Expert_.
  2. On _Photos_ tab under _Lens type_, select _Add images..._. When prompted for field of view, enter 10; this value is not important.
  3. On _Photos_ tab under _Feature Matching_, _Settings:_, select "Cpfind (multirow/stacked)". Click _Create control points_. This can take a few minutes to a few hours.
  4. On _Photos_ tab under _Optimize_, _Geometric:_, select "Custom parameters". Do not click _Calculate_ yet.
  5. On _Optimizer_ tab (tab appears after step 3) under _Image Orientation_, right-click on every column except _TrX_ and _TrY_ and click _Unselect all_. Right-click on _TrX_ and _TrY_ and click _Select all_. Make sure only values, and all values, in _TrX_ and _TrY_ columns are bold. (If your images are not level, add _Roll_ to that set.)
  6. On _Optimizer_ tab (tab appears after step 3) under _Lens Parameters_, right-click on every column and click _Unselect all_.
  7. On _Optimizer_ tab, click _Reset_, select every checkbox and click _OK_.
  8. On _Optimizer_ tab, click _Optimize now!_. This can take a few minutes to few hours.
  9. On _Photos_ tab, select all photos, right-click, select _Control points_, _Clean control points_. This can take a few minutes.
  10. On _Optimizer_ tab, click _Optimize now!_ (again). This can take a few minutes to few hours, but quicker than the first one.
  11. Select _View_ → _Fast Preview window_. This will open a new window.
  12. In preview window, under _Projection_ tab, left list box, select "Normal (rectilinear)".
  13. In preview window, use the sliders to the bottom and the right to fit the image in the viewing area; under _Move/Drag_ tab, _Drag mode:_, select "mosaic", then draw the image at the center. It allows you to estimate whether the fit is good. A good fit is seamless and all straight lines on the sample should appear completely straight in Hugin.
  14. In preview window, select the _Crop_ tab, then move the areas that are highlighted when you move the cursor near the edges of the viewing area so that only the sample is inside the white rectangle.
  15. In main window, under _Stitcher_ tab, under _Canvas size:_, click _Calculate optimal size_; under _Panorama Outputs:_ select "Exposure corrected, low dynamic range"; under _Panorama Outputs:_, _Format:_ select "PNG", under _Processing_, _Blender:_, click _Options_, enter `--fine-mask`, click _OK_.
  16. In main window, under _Stitcher_ tab click _Stitch!_. This will first open a save dialog for the Hugin project, then it will open another save dialog for the panorama output as well as intermediates (which will be temporarily placed in the same location as the panorama output), then it will open a PTBatcherGUI window. PTBatcherGUI could complain about assertion failures; ignore that.
  17. PTBatcherGUI will automatically process all files in a few dozens of minutes to a few hours. Done!

Key points:

  * Multirow CPfind is an optimal control point search method for images that are taken sequentially in multiple rows, taking less comparisons than a generic pairwise method.
  * Microphotography has practically no optical distortion to speak of and the images are usually perfectly, or near-perfectly level. Thus the only parameters Hugin should try to adjust is the X and Y translation. If it tries to adjust others, it will certainly overoptimize, especially on highly similar images such as large chunks of metal interconnect.
  * For the same reason, Hugin should assume a rectilinear lens, i.e. a lens that makes straight lines appear straight on the pictures.
  * `--fine-mask` is a workaround for a rare but annoying enblend bug.
  * Trying to move images around in any way except with a rectilinear lens and mosaic mode will change positional parameters of the images and it'll be necessary to reset these and re-optimize.

Alternatively, replace the steps 1-13 with the following script:

``` sh
#!/bin/sh
set -e

PROJECT="$1"
IMAGES="$2"

if [ -z "${IMAGES}" ]; then
  echo >&2 "Usage: $0 <projectname> '<image_glob>'"
  echo >&2 "  e.g.: $0 attiny2313 'raw*.png'"
  exit 1
fi

pto_gen -o ${PROJECT}_1.pto ${IMAGES}
cpfind -o ${PROJECT}_2.pto ${PROJECT}_1.pto --multirow
pto_var -o ${PROJECT}_3.pto ${PROJECT}_2.pto --opt TrX,TrY
autooptimiser -o ${PROJECT}_4.pto ${PROJECT}_3.pto -n
cpclean -o ${PROJECT}_5.pto ${PROJECT}_4.pto
autooptimiser -o ${PROJECT}_6.pto ${PROJECT}_5.pto -n
sed >${PROJECT}_7.pto <${PROJECT}_6.pto -e 's,^p .*$,p f0 w3000 h1500 v179  E0 R0 n"TIFF_m c:LZW r:CROP",'
```

From that you still need to proceed via hugin's GUI.

License
-------

[MIT license](LICENSE.txt)
