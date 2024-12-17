# GetCapabilities Caching Service

## Development

```sh
docker build --tag getcaps .

docker run -ti --rm --name getcaps \
--read-only \
-p 8222:8000 \
-v `pwd`/_tmp:/work \
-e CACHE_PATH=/tmp \
-e "PROXY_FORWARDED=host=openmaps.gov.bc.ca;proto=https" \
-e GEOSERVER_WMS_URL=https://gscloud.dev.api.gov.bc.ca \
-e GEOSERVER_WFS_URL=https://gscloud.dev.api.gov.bc.ca \
getcaps
```

```sh
curl -v "http:///localhost:8222/geo/wms?request=GetMap&service=WMS"
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
