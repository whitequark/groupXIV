JAVASCRIPTS = \
	vendor/leaflet/leaflet.js \
	vendor/leaflet.draw/leaflet.draw.js \
	vendor/leaflet.fullscreen/Control.FullScreen.js \
	vendor/leaflet.loading/Control.Loading.js \
	vendor/leaflet.nanoscale/Control.Nanoscale.js \
	vendor/leaflet.nanomeasure/Control.Nanomeasure.js \
	groupxiv.js \
	viewer.js

STYLESHEETS = \
	vendor/leaflet/leaflet.css \
	vendor/leaflet.draw/leaflet.draw.css \
	vendor/leaflet.fullscreen/Control.FullScreen.css \
	vendor/leaflet.loading/Control.Loading.css \
	vendor/leaflet.nanomeasure/Control.Nanomeasure.css \
	groupxiv.css

.PHONY: bundle
bundle:
	cat $(JAVASCRIPTS) >bundle/groupxiv.js
	cat $(STYLESHEETS) >bundle/groupxiv.css
