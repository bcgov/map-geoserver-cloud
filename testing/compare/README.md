# Compare utility

A utility that compares results from one instance of Geoserver with another.

```sh
SITE_A_URL="http://imai.dmz:8080" \
SITE_B_URL="https://openmaps.gov.bc.ca" \
node index.js
```

If you have the `mock` service running, it can be like:

```sh
SITE_A_URL="http://localhost:5001" \
SITE_B_URL="https://gscloud.dev.api.gov.bc.ca" \
node index.js
```

After launching index.js, open a browser and request http://localhost:5002 plus the path that you want to test. 

Example: 

http://localhost:5002/geo/pub/ows?srsName=EPSG:4326&service=WFS&request=GetFeature&version=1.1.0&cql_filter=INTERSECTS(SHAPE,SRID%3D4326;POLYGON%20((-119.88021816983391%2049.87181704313287,-118.48350851825242%2049.87181704313287,-118.48350851825242%2050.76369301100499,-119.88021816983391%2050.76369301100499,-119.88021816983391%2049.87181704313287)))&typename=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP&outputformat=application/json