# map-geoserver-cloud

Configuration to deploy [GeoServer Cloud](https://geoserver.org/geoserver-cloud/) into OpenShift for hosting public map layers.

## Installation

### Helm

Prerequisites: `helm`

```sh
helm upgrade --install geoserver ./charts/geoserver-cloud
```
