# GetCapabilities Caching Service

## Development

```sh
docker build --tag getcaps .

docker run -ti --rm --name getcaps \
--read-only \
-p 8222:8000 \
-v `pwd`/_tmp:/work \
-e ENV=dev \
-e CACHE_PATH=/work \
-e "PROXY_FORWARDED=host=openmaps.gov.bc.ca;proto=https" \
-e GEOSERVER_WMS_URL=https://gscloud.api.gov.bc.ca \
-e GEOSERVER_WFS_URL=https://gscloud.api.gov.bc.ca \
getcaps
```

**GET:**

```sh
curl -v "http:///localhost:8222/geo/wms?request=GetCapabilities&service=WMS&version=1.3.0"
```

**POST:**

```sh
curl -v "http:///localhost:8222/geo/wfs" -H "Content-Type: application/xml" -d '<GetCapabilities service="WFS" xmlns="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"/>'
```

**Long filename**:

```sh
curl -v "http:///localhost:8222/geo/pub/WHSE_TERRESTRIAL_ECOLOGY.STE_TER_STABILITY_POLYS_SVW/ows?service=WMS&request=GetCapabilities&layers=pub:WHSE_TERRESTRIAL_ECOLOGY.STE_TER_STABILITY_POLYS_SVW&legend_format=image/png&feature_info_type=text/plain"
```

```sh
python -m venv tutorial-env

source tutorial-env/bin/activate

pip install requests

GEOSERVER_WFS_URL=https://gscloud.dev.api.gov.bc.ca \
GEOSERVER_WMS_URL=https://gscloud.dev.api.gov.bc.ca \
python main.py

```

## Minio

```
docker run -ti --rm \
 -v `pwd`:/root/.mc \
 --entrypoint /bin/sh \
minio/mc
```

```
mc config host add s3 https://bc-data-obj.objectstore.gov.bc.ca data_map_geoserver_prod_usr V/kZN17SzBL85DMZl9t+Y5/aw4eeECbJ+96dE4a0

mc stat s3/data-map-geoserver-prod-bkt/data.zip --json
```

## CURL

```
docker run -ti --rm \
-p 8822:8000 \
--entrypoint /bin/sh \
-v `pwd`:/work -w /work \
docker.io/curlimages/curl:latest

wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O yq
chmod +x yq
cat s3_stat.json | ./yq -o yaml '. as $item ireduce({person: {} }; .person = $item )'

./yq -oy -p=json s3_stat.json

./yq -o yaml '. as $item ireduce({"person": {} }; .person = $item )' s3_stat.yaml

./yq -oy -p=json s3_stat.json | ./yq -o yaml '. as $item ireduce({"s3-data": {} }; .s3-data = $item )'

```

## Verification - DEV

```sh
curl -v "https:///gscloud.dev.api.gov.bc.ca/geo/wfs" -H "Content-Type: application/xml" -d '<GetCapabilities service="WFS" xmlns="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"/>'
```