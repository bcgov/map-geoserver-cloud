# PNG to HTML page proxy

This small nodejs application takes a request for an PNG image and returns an HTML page with
the relevant `<img>` tag sourcing the PNG file.

```sh
TARGET_URL=https://delivery.openmaps.gov.bc.ca/geo node index
TARGET_URL=https://geoserver-ec38a0-test.apps.gold.devops.gov.bc.ca node index
```

## Running in Docker

```sh
docker build --tag htmlpage .

docker run -ti --rm -e TARGET_URL=https://openmaps.gov.bc.ca/geo -p 3001:3000 htmlpage
```
