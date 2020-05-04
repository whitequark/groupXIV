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

function initViewer(options, url) {
  document.title = options.name + " \u00b7 GroupXIV microphotography viewer"

  var map = GroupXIV({
    viewport: "viewer",
    scale: options.scale,
    tileSize: options.tileSize,
    layers: options.layers,
    tilesAlignedTopLeft: options.tilesAlignedTopLeft,
  });

  function moveMap(params) {
    if(params.x && params.y && params.z) {
      var center = map.unproject([parseInt(params.x), parseInt(params.y)], map.getMaxZoom() - 1),
          zoom = parseInt(params.z);
      map.setView(center, zoom);
    }
  }

  map.on('moveend', function(e) {
    var center = map.project(map.getCenter(), map.getMaxZoom() - 1),
        zoom = map.getZoom();
    var state = "#";
    if(options["canChangeURL"]) {
      state += "url=" + url + "&";
    }
    state += "x=" + (center.x|0) + "&";
    state += "y=" + (center.y|0) + "&";
    state += "z=" + zoom;
    history.replaceState(null, null, state);
  });

  moveMap(parseHash());
  window.onhashchange = function() {
    var params = parseHash();
    if(options["canChangeURL"] && params["url"] != url) {
      window.location.reload();
    } else {
      moveMap(params);
    }
  }
}

function loadViewer(url, options) {
  var viewerOptions = (options === undefined) ? {} : options;
  var canChangeURL = (url === undefined);
  if (canChangeURL) {
    viewerOptions["canChangeURL"] = canChangeURL;
    var params = parseHash();
    url = params["url"];
  }

  var req = new XMLHttpRequest();
  req.onload = function() {
    var responseOptions = JSON.parse(req.responseText);
    responseOptions.layers.forEach(function(layer) {
      layer.URL = url + "/../" + layer.URL;
      layer.URL = layer.URL.replace(/[^\/]+\/..(\/|$)/, '');
    });
    initViewer(Object.assign({}, viewerOptions, responseOptions), url);
  };
  req.onerror = function() {
    var error = document.createElement("div");
    error.className = "error";
    error.innerText = "Cannot load " + url;
    document.getElementById("viewer").appendChild(error);
    window.onhashchange = function() {
      var params = parseHash();
      if (canChangeURL && params["url"] != url) {
        window.location.reload();
      }
    }
  }
  req.open("get", url, true);
  req.send();
}
