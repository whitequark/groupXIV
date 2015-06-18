L.Control.Nanoscale = L.Control.extend({
  options: {
    position: 'topright',
    maxWidth: 300,
    updateWhenIdle: false,
    nanometersPerPixel: 1000,
    /*ratioAtZoom: undefined,*/
  },

  onAdd: function (map) {
    this._map = map;

    var className = 'leaflet-control-scale',
        container = L.DomUtil.create('div', className),
        options = this.options;

    this._addScales(options, className, container);

    map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    map.whenReady(this._update, this);

    return container;
  },

  onRemove: function (map) {
    map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
  },

  _addScales: function (options, className, container) {
    this._scale = L.DomUtil.create('div', className + '-line', container);
  },

  _update: function () {
    var options = this.options,

        bounds = this._map.getBounds(),
        maxZoom = options.ratioAtZoom !== undefined ? options.ratioAtZoom :
                  this._map.getMaxZoom(),
        dist = (this._map.project(bounds.getNorthEast(), maxZoom).x -
                this._map.project(bounds.getSouthWest(), maxZoom).x),

        size = this._map.getSize(),
        maxNanometers = 0;

    if (size.x > 0) {
      maxNanometers = dist * (options.maxWidth / size.x) * options.nanometersPerPixel;
    }

    this._updateScales(options, maxNanometers);
  },

  _updateScales: function (options, maxNanometers) {
    var nanometers = this._getRoundNum(maxNanometers);

    this._scale.style.width = this._getScaleWidth(nanometers / maxNanometers) + 'px';
    this._scale.innerHTML =
      nanometers < 1000 ? nanometers + ' nm' :
      nanometers < 1000000 ? (nanometers / 1000) + ' \u00b5m' :
      (nanometers / 1000000) + ' mm';
  },

  _getScaleWidth: function (ratio) {
    return Math.round(this.options.maxWidth * ratio) - 10;
  },

  _getRoundNum: function (num) {
    var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
        d = num / pow10;

    d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

    return pow10 * d;
  }
});

L.control.nanoscale = function (options) {
  return new L.Control.Nanoscale(options);
};
