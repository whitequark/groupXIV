L.Nanomeasure = {};

L.Nanomeasure.Util = {
    readableDistance: function(nanometers) {
        return nanometers < 1000 ? nanometers.toFixed(0) + ' nm' :
               nanometers < 1000000 ? (nanometers / 1000).toFixed(3) + ' \u00b5m' :
               (nanometers / 1000000).toFixed(3) + ' mm';
    },

    readableArea: function(nanometers) {
        return nanometers < 1000*1000 ? nanometers.toFixed(0) + ' nm\u00b2' :
               nanometers < 1000000*1000000 ?
                    (nanometers / (1000*1000)).toFixed(0) + ' \u00b5m\u00b2' :
                (nanometers / (1000000*1000000)).toFixed(3) + ' mm\u00b2';
    },

    polygonArea: function(points) {
        var area = 0, j = points.length - 1;
        for(var i = 0; i < points.length; i++) {
            area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
            j = i;
        }
        return Math.abs(area / 2);
    }
}

L.Nanomeasure.Mixin = function(parent) {
    return {
        addHooks: function() {
            parent.prototype.addHooks.call(this);

            if (this._map) {
                this._map.on('click', this._onClick, this);
                this._map.on('zoomstart', this._onZoomStart, this);
                this._drawing = true;
            }
        },

        removeHooks: function () {
            this._finishShape();
            this._map.off('zoomstart', this._onZoomStart, this);
            this._map.off('click', this._onClick, this);

            parent.prototype.removeHooks.call(this);
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

            this._finalize();
            this._updateTooltip(this._currentLatLng);

            this._map.off('mousemove', this._onMouseMove, this);
            this._container.style.cursor = '';
        },

        _removeShape: function() {
            this._markers.splice(0);
            this._markerGroup.clearLayers();

            if (!this._poly)
                return;
            this._map.removeLayer(this._poly);
            delete this._poly;
        },

        _onClick: function(e) {
            if (!this._drawing) {
                this._removeShape();
                this._startShape();
            }
        },

        _onZoomStart: function(e) {
            this._tooltip._container.style.visibility = 'hidden';
        },

        _onZoomEnd: function(e) {
            if(this._drawing) {
                parent.prototype._onZoomEnd.call(this, e);
            }

            this._updateTooltip(this._currentLatLng);

            this._tooltip._container.style.visibility = 'inherit';
        },

        _getTooltipText: function() {
            var labelText = parent.prototype._getTooltipText.call(this);
            if (!this._drawing) {
                // put measurement string into main text
                labelText.text = labelText.subtext;
                delete labelText.subtext;
            }
            return labelText;
        }
    }
}

L.Nanomeasure.Distance = L.Draw.Polyline.
        extend(L.Nanomeasure.Mixin(L.Draw.Polyline)).
        extend({
    _finalize: function() {
        if(this._markers.length > 0) {
            this._currentLatLng = this._markers[this._markers.length - 1].getLatLng();
        }
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

        return L.Nanomeasure.Util.readableDistance(distance);
    },
});

L.Nanomeasure.Area = L.Draw.Polygon.
        extend(L.Nanomeasure.Mixin(L.Draw.Polygon)).
        extend({
    _finalize: function() {
        if(this._markers.length > 0) {
            this._currentLatLng = this._markers[0].getLatLng();
        }

        if(this._shapeIsValid())
            this._poly.addLatLng(this._markers[0].getLatLng())
    },

    _vertexChanged: function (latlng, added) {
        // Check to see if we should show the area
        if (!this.options.allowIntersection && this.options.showArea) {
            var zoom = this.options.ratioAtZoom !== undefined ?
                        this.options.ratioAtZoom : this._map.getMaxZoom(),
                map = this._map;
            this._area = L.Nanomeasure.Util.polygonArea(
                this._poly.getLatLngs().map(function(latlng) {
                    return map.project(latlng, zoom);
                })) * Math.pow(this.options.nanometersPerPixel, 2);
        }

        L.Draw.Polyline.prototype._vertexChanged.call(this, latlng, added);
    },

    _getMeasurementString: function () {
        var area = this._area;

        if (!area) {
            return null;
        }

        return L.Nanomeasure.Util.readableArea(area);
    },

});

L.Control.Nanomeasure = L.Control.extend({
    statics: {
        DISTANCE: 'Measure distance',
        AREA: 'Measure area',
    },

    options: {
        position: 'topleft',
        measureDistance: {},
        measureArea: {},
        nanometersPerPixel: 1000,
        /*ratioAtZoom: undefined,*/
    },

    toggleDistance: function() {
        if (this.measureDistance.enabled()) {
            this.measureDistance.disable();
        } else {
            if(this.measureArea.enabled()) {
                this.measureArea.disable();
            }

            this.measureDistance.enable();
        }
    },

    toggleArea: function() {
        if (this.measureArea.enabled()) {
            this.measureArea.disable();
        } else {
            if(this.measureDistance.enabled()) {
                this.measureDistance.disable();
            }

            this.measureArea.enable();
        }
    },

    onAdd: function(map) {
        var className = 'leaflet-control-nanomeasure leaflet-control-nanomeasure';

        this._container = L.DomUtil.create('div', 'leaflet-bar');

        var distanceButton = L.DomUtil.create('a', className + '-distance', this._container);
        distanceButton.href = '#';
        distanceButton.title = L.Control.Nanomeasure.DISTANCE;

        L.DomEvent
            .addListener(distanceButton, 'click', L.DomEvent.stopPropagation)
            .addListener(distanceButton, 'click', L.DomEvent.preventDefault)
            .addListener(distanceButton, 'click', this.toggleDistance, this);

        this.measureDistance = new L.Nanomeasure.Distance(map,
            L.extend(this.options.measureDistance, {
                nanometersPerPixel: this.options.nanometersPerPixel,
                ratioAtZoom: this.options.ratioAtZoom,
            }));

        this.measureDistance.on('enabled', function () {
            L.DomUtil.addClass(distanceButton, 'enabled');
        }, this);

        this.measureDistance.on('disabled', function () {
            L.DomUtil.removeClass(distanceButton, 'enabled');
        }, this);

        var areaButton = L.DomUtil.create('a', className + '-area', this._container);
        areaButton.href = '#';
        areaButton.title = L.Control.Nanomeasure.AREA;

        L.DomEvent
            .addListener(areaButton, 'click', L.DomEvent.stopPropagation)
            .addListener(areaButton, 'click', L.DomEvent.preventDefault)
            .addListener(areaButton, 'click', this.toggleArea, this);

        this.measureArea = new L.Nanomeasure.Area(map,
            L.extend(this.options.measureArea, {
                nanometersPerPixel: this.options.nanometersPerPixel,
                ratioAtZoom: this.options.ratioAtZoom,
                allowIntersection: false,
                showArea: true,
            }));

        this.measureArea.on('enabled', function () {
            L.DomUtil.addClass(areaButton, 'enabled');
        }, this);

        this.measureArea.on('disabled', function () {
            L.DomUtil.removeClass(areaButton, 'enabled');
        }, this);

        return this._container;
    }
});

L.control.nanomeasure = function (options) {
    return new L.Control.Nanomeasure(options);
};
