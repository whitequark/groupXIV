/*
 Options:
   viewport:  DOM id of the viewport
   baseURL:   URL of the original image
   imageSize: tiled image dimension
   width:     original image width
   height:    original image height
   scale:     image scale (µm/px)
   tileSize:  tile dimension (default: 512)
 */
function GroupXIV(options) {
  var viewport  = options.viewport,
      baseURL   = options.baseURL,
      imageSize = options.imageSize,
      width     = options.width,
      height    = options.height,
      scale     = options.scale,
      tileSize  = options.tileSize || 512;

  var map = L.map(options.viewport, {
    minZoom: 1,
    maxZoom: Math.ceil(Math.log2(imageSize / tileSize)),
    center:  [0, 0],
    zoom:    1,
    crs:     L.CRS.Simple,
  });

  var marginX = (imageSize - width) / 2,
      marginY = (imageSize - height) / 2;
  var bounds = new L.LatLngBounds(
    map.unproject([imageSize - marginX, marginY], map.getMaxZoom()),
    map.unproject([marginX, imageSize - marginY], map.getMaxZoom()));

  L.tileLayer(baseURL + "-tiles/{z}/{x}/{y}.png", {
    maxZoom:         map.getMaxZoom(),
    tileSize:        tileSize,
    continuousWorld: true,
    noWrap:          true,
    detectRetina:    true,
    attribution:     baseURL,
  }).addTo(map);

  map.setMaxBounds(bounds);
}
