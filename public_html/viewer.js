function parseHash() {
  var output = {};
  var pairs = window.location.hash.substring(1).split("&");
  pairs.forEach(function(pair) {
    var parts = pair.split("=", 2),
        key = parts[0],
        value = parts[1];
    output[key] = value;
  });
  return output;
}

function initViewer(options, params) {
  var map = GroupXIV({
    viewport: "viewer",
    scale: options.scale,
    tileSize: options.tileSize,
    layers: options.layers,
  });

  if(params.x && params.y && params.z) {
    var center = map.unproject([parseInt(params.x), parseInt(params.y)], map.getMaxZoom()),
        zoom = parseInt(params.z);
    // setTimeout(function() {
      map.setView(center, zoom);
    // }, 500);
  }

  map.on('moveend', function(e) {
    var center = map.project(map.getCenter(), map.getMaxZoom()),
        zoom = map.getZoom();
    window.location.hash = "#x=" + center.x + "&y=" + center.y + "&z=" + zoom;
  });

  return map;
}

function pageLoad() {
  window.map = initViewer({
    scale: 540,
    layers: [{ baseURL: "data/atmega8.png", width: 5348, height: 5144,
               tileSize: 512, imageSize: 8192 }],
  }, parseHash());
}
