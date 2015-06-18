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

function initViewer(url, params) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    var options = JSON.parse(req.responseText);
    options.layers.forEach(function(layer) {
      layer.URL = url + "/../" + layer.URL;
    });

    document.title = options.name + " \u00b7 GroupXIV microphotography viewer"

    var map = GroupXIV({
      viewport: "viewer",
      scale: options.scale,
      tileSize: options.tileSize,
      layers: options.layers,
    });

    if(params.x && params.y && params.z) {
      var center = map.unproject([parseInt(params.x), parseInt(params.y)], map.getMaxZoom() - 1),
          zoom = parseInt(params.z);
      map.setView(center, zoom);
    }

    map.on('moveend', function(e) {
      var center = map.project(map.getCenter(), map.getMaxZoom() - 1),
          zoom = map.getZoom();
      window.location.hash = "#url=" + url + "&x=" + center.x + "&y=" + center.y + "&z=" + zoom;
    });

    return map;
  };
  req.open("get", url, true);
  req.send();
}

function pageLoad() {
  var params = parseHash();
  initViewer(params["url"], params);
}
