SLUG := slug-here
VERSION := 0

.PHONY: all
all: \
	geo/clean/$(SLUG)-v$(VERSION).pmtiles
	
.PHONY: clean
clean:
	rm -rf geo/raw/*

geo/raw/us-highest-res.shp:
	mkdir -p $(dir $@)
	wget -qcO geo/raw/us-highest-res.zip 'https://www.dropbox.com/s/0w2e11461zagblu/us-highest-res.zip'
	unzip -o geo/raw/us-highest-res.zip -d $(dir $@)

geo/raw/us-clipBy.shp: geo/raw/us-highest-res.shp
	mkdir -p $(dir $@)
	npx mapshaper -i $< \
		-dissolve2 \
		-o $@
	
geo/raw/cb_2018_us_county_500k.shp:
	mkdir -p $(dir $@)
	wget -qcO geo/raw/cb_2018_us_county_500k.zip 'https://www2.census.gov/geo/tiger/GENZ2018/shp/cb_2018_us_county_500k.zip'
	unzip geo/raw/cb_2018_us_county_500k.zip -d $(dir $@)

geo/clean/counties.json: geo/raw/cb_2018_us_county_500k.shp analysis/data/clean/map_by_county.csv geo/raw/us-clipBy.shp
	npx mapshaper \
		-i $< \
		-filter "'78,72,69,66,60'.indexOf(STATEFP) == -1" \
		-clip geo/raw/us-clipBy.shp \
		-clean \
		-join analysis/data/clean/map_by_county.csv \
			keys=GEOID,GEOID string-fields=GEOID \
		-info \
		-each 'GEOID_N = +GEOID' \
		-o gj2008 id-field=GEOID_N $@

geo/clean/counties.shp: geo/clean/counties.json
	npx mapshaper \
		-i $< \
		-o $@

geo/clean/$(SLUG)-v$(VERSION).pmtiles: geo/clean/counties.json
	mkdir -p $(dir $@)
	tippecanoe \
		--force \
		--named-layer=counties:geo/clean/counties.json \
		--read-parallel \
		--no-polygon-splitting \
		--no-tile-size-limit \
		--drop-rate=0 \
		--maximum-zoom=12 \
		--name=analysis \
		--output $@

