/*
 Options:
   viewport:  DOM id of the viewport
   scale:     image scale (nm/px)
   layers:    array of:
     URL:       URL of the original image
     width:     original image width
     height:    original image height
     tileSize:  tile dimension (default: 512)
     imageSize: tiled image dimension
 */
function GroupXIV(options) {
  var viewport  = options.viewport,
      scale     = options.scale,
      layers    = options.layers;

  var maxImageSize = 0, maxWidth = 0, maxHeight = 0, maxZoom = 1;
  layers.forEach(function(layer) {
    if(layer.imageSize > maxImageSize)
      maxImageSize = layer.imageSize;
    if(layer.width > maxWidth)
      maxWidth = layer.width;
    if(layer.height > maxHeight)
      maxHeight = layer.height;

    var zoom = Math.ceil(Math.log2(layer.imageSize / layer.tileSize));
    if(zoom > maxZoom)
      maxZoom = zoom;
  });

  var map = L.map(options.viewport, {
    minZoom: 1,
    maxZoom: maxZoom + 1,
    crs:     L.CRS.Simple,

    zoom:    0,
    center:  [maxImageSize / 2, maxImageSize / 2],
  });

  var marginX = (maxImageSize - maxWidth)  / 2,
      marginY = (maxImageSize - maxHeight) / 2;
  map.setMaxBounds(new L.LatLngBounds(
    map.unproject([maxImageSize - marginX, marginY], map.getMaxZoom() - 1),
    map.unproject([marginX, maxImageSize - marginY], map.getMaxZoom() - 1)));

  layers.forEach(function(layer) {
    L.tileLayer(layer.URL + "-tiles/{z}/{x}/{y}.png", {
      maxNativeZoom:   Math.ceil(Math.log2(layer.imageSize / layer.tileSize)),
      tileSize:        layer.tileSize,
      continuousWorld: true,
      detectRetina:    true,
      attribution:     layer.URL,
    }).addTo(map);
  });

  L.control.nanoscale({
    nanometersPerPixel: scale,
    ratioAtZoom: map.getMaxZoom() - 1,
  }).addTo(map);

  L.control.nanomeasure({
    nanometersPerPixel: scale,
    ratioAtZoom: map.getMaxZoom() - 1,
  }).addTo(map);

  L.control.fullscreen({
    forceSeparateButton: true,
  }).addTo(map);

  map.on('enterFullscreen', function(){
    document.getElementById('viewer').style.position = 'relative';
  });

  map.on('exitFullscreen', function(){
    document.getElementById('viewer').style.position = 'absolute';
  });

  L.Control.loading({
    separate: true,
  }).addTo(map);

  return map;
}
