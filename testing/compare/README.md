# Compare utility

A utility that compares results from one instance of Geoserver with another.

```sh
SITE_A_URL="https://delivery.openmaps.gov.bc.ca" \
SITE_B_URL="https://gscloud.dev.api.gov.bc.ca" \
node index.js
```

For `SITE_B` the `gscloud=true` is passed automatically.

```sh
SITE_A_URL="delivery.openmaps.gov.bc.ca" \
SITE_B_URL="delivery.openmaps.gov.bc.ca" \
node index.js
```

If you have the `mock` service running, it can be like:

```sh
SITE_A_URL="http://localhost:5001" \
SITE_B_URL="https://gscloud.dev.api.gov.bc.ca" \
node index.js
```
