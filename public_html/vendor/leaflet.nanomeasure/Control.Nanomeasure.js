L.NanomeasureUtil = {
    readableDistance: function(nanometers) {
        return nanometers < 1000 ? nanometers.toFixed(0) + ' nm' :
               nanometers < 1000000 ? (nanometers / 1000).toFixed(3) + ' \u00b5m' :
               (nanometers / 1000000).toFixed(3) + ' mm';
    }
}

L.Polyline.Nanomeasure = L.Draw.Polyline.extend({
    addHooks: function() {
        L.Draw.Polyline.prototype.addHooks.call(this);
        if (this._map) {
            this._map.on('click', this._onClick, this);
            this._map.on('zoomstart', this._onZoomStart, this);
            this._startShape();
        }
    },

    removeHooks: function () {
        L.Draw.Polyline.prototype.removeHooks.call(this);

        this._removeShape();
        this._map.off('zoomstart', this._onZoomStart, this);
        this._map.off('click', this._onClick, this);
    },

    _startShape: function() {
        this._drawing = true;
        this._poly = new L.Polyline([], this.options.shapeOptions);

        this._container.style.cursor = 'crosshair';

        this._updateTooltip();
        this._map.on('mousemove', this._onMouseMove, this);
    },

    _finishShape: function () {
        this._drawing = false;

        this._cleanUpShape();
        this._clearGuides();

        this._updateTooltip(this._markers[this._markers.length - 1].getLatLng());

        this._map.off('mousemove', this._onMouseMove, this);
        this._container.style.cursor = '';
    },

    _removeShape: function() {
        this._markers.splice(0);
        this._markerGroup.clearLayers();

        this._container.style.cursor = '';

        if (!this._poly)
            return;
        this._map.removeLayer(this._poly);
        delete this._poly;
    },

    _onClick: function(e) {
        if (!this._drawing) {
            this._removeShape();
            this._startShape();
            return;
        }
    },

    _onZoomStart: function(e) {
        this._tooltip._container.style.visibility = 'hidden';
    },

    _onZoomEnd: function(e) {
        L.Draw.Polyline.prototype._onZoomEnd.call(this, e);

        if(this.drawing) {
            this._tooltip.updatePosition(this._currentLatLng);
        } else {
            this._tooltip.updatePosition(this._markers[this._markers.length - 1].getLatLng());
        }

        this._tooltip._container.style.visibility = 'inherit';
    },

    _updateRunningMeasure: function (latlng, added) {
        var markersLength = this._markers.length,
            previousMarkerIndex, distance;

        if (this._markers.length === 1) {
            this._measurementRunningTotal = 0;
        } else {
            var zoom = this.options.ratioAtZoom !== undefined ?
                        this.options.ratioAtZoom : this._map.getMaxZoom();

            previousMarkerIndex = markersLength - (added ? 2 : 1);
            distance = this._map.project(latlng, zoom).
                distanceTo(this._map.project(
                    this._markers[previousMarkerIndex].getLatLng(), zoom));

            this._measurementRunningTotal += distance *
                this.options.nanometersPerPixel * (added ? 1 : -1);
        }
    },

    _getMeasurementString: function () {
        var currentLatLng = this._currentLatLng,
            previousLatLng = this._markers[this._markers.length - 1].getLatLng(),
            distance;

        distance = this._measurementRunningTotal;
        if(this._drawing) {
            // calculate the distance from the last fixed point to the mouse position
            var zoom = this.options.ratioAtZoom !== undefined ?
                        this.options.ratioAtZoom : this._map.getMaxZoom();
            distance += this._map.project(currentLatLng, zoom).distanceTo(
                this._map.project(previousLatLng, zoom)) * this.options.nanometersPerPixel;
        }

        return L.NanomeasureUtil.readableDistance(distance);
    },

    _getTooltipText: function() {
        var labelText = L.Draw.Polyline.prototype._getTooltipText.call(this);
        if (!this._drawing) {
            labelText.text = labelText.subtext;
            delete labelText.subtext;
        }
        return labelText;
    }
});

L.Control.Nanomeasure = L.Control.extend({
    statics: {
        TITLE: 'Measure distances'
    },

    options: {
        position: 'topleft',
        nanometersPerPixel: 1000,
        /*ratioAtZoom: undefined,*/
    },

    toggle: function() {
        if (this.handler.enabled()) {
            this.handler.disable.call(this.handler);
        } else {
            this.handler.enable.call(this.handler);
        }
    },

    onAdd: function(map) {
        var className = 'leaflet-control-draw';

        this._container = L.DomUtil.create('div', 'leaflet-bar');

        this.handler = new L.Polyline.Nanomeasure(map, {
            nanometersPerPixel: this.options.nanometersPerPixel,
            ratioAtZoom: this.options.ratioAtZoom,
        });

        this.handler.on('enabled', function () {
            L.DomUtil.addClass(this._container, 'enabled');
        }, this);

        this.handler.on('disabled', function () {
            L.DomUtil.removeClass(this._container, 'enabled');
        }, this);

        var link = L.DomUtil.create('a', className + '-nanomeasure', this._container);
        link.href = '#';
        link.title = L.Control.Nanomeasure.TITLE;

        L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', this.toggle, this);

        return this._container;
    }
});

L.control.nanomeasure = function (options) {
    return new L.Control.Nanomeasure(options);
};
