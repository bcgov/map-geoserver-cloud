# Mocks

## Saving a response

```sh
curl -v -o wfs-get-feature-60.json "https://delivery.openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW&srsname=EPSG%3A4326&cql_filter=INTERSECTS%28SHAPE%2CPOINT%281273050.7965272+457403.76083951%29%29&propertyName=%2A&outputFormat=application%2Fjson"

curl -v -o wms-getfeatureinfo.xml "https://test.openmaps.gov.bc.ca/geo/pub/WHSE_FOREST_VEGETATION.VEG_BURN_SEVERITY_SAME_YR_SP/ows?CRS=EPSG:3978&FORMAT=image/png&INFO_FORMAT=text/plain&I=202&STYLES=&J=409&WIDTH=288&HEIGHT=700&LAYERS=pub:WHSE_FOREST_VEGETATION.VEG_BURN_SEVERITY_SAME_YR_SP&REQUEST=GetFeatureInfo&BBOX=-1662814.9019981364,537059.0463286346,-1660528.8974261272,542615.307441157&VERSION=1.3.0&SERVICE=WMS&QUERY_LAYERS=pub:WHSE_FOREST_VEGETATION.VEG_BURN_SEVERITY_SAME_YR_SP"
```
