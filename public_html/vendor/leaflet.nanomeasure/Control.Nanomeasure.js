L.Nanomeasure = {};

L.Nanomeasure.Util = {
    readableDistance: function(nanometers) {
        var absNanometers = Math.abs(nanometers);
        return absNanometers < 1000 ? nanometers.toFixed(0) + ' nm' :
               absNanometers < 1000000 ? (nanometers / 1000).toFixed(3) + ' \u00b5m' :
               (nanometers / 1000000).toFixed(3) + ' mm';
    },

    readableArea: function(nanometers) {
        var absNanometers = Math.abs(nanometers);
        return absNanometers < 1000*1000 ? nanometers.toFixed(0) + ' nm\u00b2' :
               absNanometers < 1000000*1000000 ?
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

L.Nanomeasure.Coordinates = L.Draw.Marker.
        extend({
    addHooks: function() {
        L.Draw.Marker.prototype.addHooks.call(this);

        if (this._map) {
            this._drawing = true;
            this._map.on('zoomstart', this._onZoomStart, this);
            this._map.on('zoomend', this._onZoomEnd, this);
        }
    },

    removeHooks: function() {
        this._drawing = false;
        this._map.off('zoomstart', this._onZoomStart, this);
        this._map.off('zoomend', this._onZoomEnd, this);

        L.Draw.Marker.prototype.removeHooks.call(this);
    },

    _onMouseMove: function(e) {
        if(this._drawing) {
            L.Draw.Marker.prototype._onMouseMove.call(this, e);

            var zoom = this.options.ratioAtZoom !== undefined ?
                        this.options.ratioAtZoom : this._map.getMaxZoom();
            var centerCoords = this._map.project(this._map.getCenter(), zoom);
            var markerCoords = this._map.project(this._mouseMarker.getLatLng(), zoom)
            var coords = markerCoords.subtract(centerCoords);

            this._tooltip.updateContent({
                text: L.Nanomeasure.Util.readableDistance(coords.x) + ' ' +
                      L.Nanomeasure.Util.readableDistance(coords.y)
            });
        }
    },

    _onClick: function() {
        if(this._drawing) {
            this._drawing = false;
        } else {
            this.disable();
            if (this.options.repeatMode) {
                this.enable();
            }
            this._drawing = true;
        }
    },

    _onZoomStart: function(e) {
        this._tooltip._container.style.visibility = 'hidden';
    },

    _onZoomEnd: function(e) {
        this._tooltip.updatePosition(this._mouseMarker.getLatLng());

        this._tooltip._container.style.visibility = 'inherit';
    },
});

L.Nanomeasure.PolylineMixin = function(parent) {
    return {
        addHooks: function() {
            parent.prototype.addHooks.call(this);

            if (this._map) {
                this._map.on('click', this._onClick, this);
                this._map.on('zoomstart', this._onZoomStart, this);
                this._drawing = true;
            }
        },

        removeHooks: function() {
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

        _finishShape: function() {
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
        extend(L.Nanomeasure.PolylineMixin(L.Draw.Polyline)).
        extend({
    _finalize: function() {
        if(this._markers.length > 0) {
            this._currentLatLng = this._markers[this._markers.length - 1].getLatLng();
        }
    },

    _updateRunningMeasure: function(latlng, added) {
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

    _getMeasurementString: function() {
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
        extend(L.Nanomeasure.PolylineMixin(L.Draw.Polygon)).
        extend({
    _finalize: function() {
        if(this._markers.length > 0) {
            this._currentLatLng = this._markers[0].getLatLng();
        }

        if(this._shapeIsValid())
            this._poly.addLatLng(this._markers[0].getLatLng())
    },

    _vertexChanged: function(latlng, added) {
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

    _getMeasurementString: function() {
        var area = this._area;

        if (!area) {
            return null;
        }

        return L.Nanomeasure.Util.readableArea(area);
    },

});

L.Control.Nanomeasure = L.Control.extend({
    statics: {
        COORDINATES: 'Measure coordinates',
        DISTANCE: 'Measure distance',
        AREA: 'Measure area',
    },

    options: {
        position: 'topleft',
        measureCoordinates: {},
        measureDistance: {},
        measureArea: {},
        nanometersPerPixel: 1000,
        /*ratioAtZoom: undefined,*/
    },

    measurementTools: [],

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

    addButton: function(className, title, measurementTool) {
        var baseClassName = 'leaflet-control-nanomeasure leaflet-control-nanomeasure';
        var button = L.DomUtil.create('a', baseClassName + '-' + className, this._container);
        button.href = '#';
        button.title = title;

        this.measurementTools.push(measurementTool);

        var $this = this;
        function toggleTool() {
            if(measurementTool.enabled()) {
                measurementTool.disable();
            } else {
                $this.measurementTools.forEach(function(otherTool) {
                    otherTool.disable();
                });
                measurementTool.enable();
            }
        }

        L.DomEvent
            .addListener(button, 'click', L.DomEvent.stopPropagation)
            .addListener(button, 'click', L.DomEvent.preventDefault)
            .addListener(button, 'click', toggleTool, this);

        measurementTool.on('enabled', function() {
            L.DomUtil.addClass(button, 'enabled');
        }, this);

        measurementTool.on('disabled', function() {
            L.DomUtil.removeClass(button, 'enabled');
        }, this);
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'leaflet-bar');

        this.addButton('coordinates', L.Control.Nanomeasure.COORDINATES,
            new L.Nanomeasure.Coordinates(map,
                L.extend(this.options.measureCoordinates, {
                    nanometersPerPixel: this.options.nanometersPerPixel,
                    ratioAtZoom: this.options.ratioAtZoom,
                    repeatMode: true,
                })));

        this.addButton('distance', L.Control.Nanomeasure.DISTANCE,
            new L.Nanomeasure.Distance(map,
                L.extend(this.options.measureDistance, {
                    nanometersPerPixel: this.options.nanometersPerPixel,
                    ratioAtZoom: this.options.ratioAtZoom,
                })));

        this.addButton('area', L.Control.Nanomeasure.AREA,
            new L.Nanomeasure.Area(map,
                L.extend(this.options.measureArea, {
                    nanometersPerPixel: this.options.nanometersPerPixel,
                    ratioAtZoom: this.options.ratioAtZoom,
                    allowIntersection: false,
                    showArea: true,
                })));

        return this._container;
    }
});

L.control.nanomeasure = function(options) {
    return new L.Control.Nanomeasure(options);
};
