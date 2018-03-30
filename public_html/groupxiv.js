/*
 Options:
   viewport:  DOM id of the viewport
   scale:     image scale (nm/px)
   layers:    array of:
     URL:       URL of the original image
     width:     original image width
     height:    original image height
     tileSize:  tile dimension
     imageSize: smallest square image size that fits all tiles at maximum zoom
     minZoom:   minimum zoom level (default: 1)
     maxZoom:   maximum zoom level (default: ceil(log2(imageSize/tileSize)))
 */
function GroupXIV(options) {
  var viewport  = options.viewport,
      scale     = options.scale,
      layers    = options.layers;

  var maxImageSize = 0, maxWidth = 0, maxHeight = 0, minZoom = 1, maxZoom = 1;
  layers.forEach(function(layer) {
    if(layer.imageSize > maxImageSize)
      maxImageSize = layer.imageSize;
    if(layer.width > maxWidth)
      maxWidth = layer.width;
    if(layer.height > maxHeight)
      maxHeight = layer.height;

    var layerMaxDim = Math.max(layer.width, layer.height);
    var layerMinZoom = layer.minZoom, layerMaxZoom = layer.maxZoom;
    if(layerMinZoom === undefined)
      layerMinZoom = 1;
    if(layerMaxZoom === undefined)
      layerMaxZoom = Math.ceil(Math.log2(layer.imageSize / layer.tileSize));

    if(layerMinZoom < minZoom)
      minZoom = layerMinZoom;
    if(layerMaxZoom > maxZoom)
      maxZoom = layerMaxZoom;
  });

  var map = L.map(options.viewport, {
    minZoom: minZoom,
    maxZoom: maxZoom,
    crs:     L.CRS.Simple,
  });

  var center = map.unproject([maxImageSize / 2, maxImageSize / 2], maxZoom);
  map.setView(center, minZoom);

  if(options.tilesAlignedTopLeft) {
    map.setMaxBounds(new L.LatLngBounds(
      map.unproject([0, 0], maxZoom),
      map.unproject([maxWidth, maxHeight], maxZoom)));
  } else {
    var marginX = (maxImageSize - maxWidth)  / 2,
        marginY = (maxImageSize - maxHeight) / 2;
    map.setMaxBounds(new L.LatLngBounds(
      map.unproject([maxImageSize - marginX, marginY], maxZoom),
      map.unproject([marginX, maxImageSize - marginY], maxZoom)));
  }

  layers.forEach(function(layer) {
    var layerMaxZoom = layer.maxZoom;
    if(layerMaxZoom === undefined)
      layerMaxZoom = Math.ceil(Math.log2(layer.imageSize / layer.tileSize));

    L.tileLayer(layer.URL + "-tiles/{z}/{x}/{y}.png", {
      maxNativeZoom:   layerMaxZoom,
      tileSize:        layer.tileSize,
      continuousWorld: true,
      detectRetina:    true,
      attribution:     layer.URL,
    }).addTo(map);
  });

  if(scale !== undefined) {
    L.control.nanoscale({
      nanometersPerPixel: scale,
      ratioAtZoom: maxZoom,
    }).addTo(map);

    L.control.nanomeasure({
      nanometersPerPixel: scale,
      ratioAtZoom: maxZoom,
    }).addTo(map);
  }

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
