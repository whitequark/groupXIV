JAVASCRIPTS = \
	vendor/leaflet/leaflet.js \
	vendor/leaflet.tilelayer.fallback/leaflet.tilelayer.fallback.js \
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

IMAGES = \
	vendor/leaflet/images \
	vendor/leaflet.fullscreen/images \
	vendor/leaflet.draw/images \
	vendor/leaflet.nanomeasure/images

.PHONY: bundle
bundle:
	cat $(addprefix public_html/,$(JAVASCRIPTS)) >public_html/bundle/groupxiv.js
	cat $(addprefix public_html/,$(STYLESHEETS)) >public_html/bundle/groupxiv.css
	cp -r $(addprefix public_html/,$(IMAGES)) public_html/bundle/
