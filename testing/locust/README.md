# Load testing with Locust.io

## Data preparation

The samples used by locust are created by going through the logs from a typical day, and picking out all the `GetMap` requests that had `200` responses. Then for each unique `query` string (excluding bounding box), it will pick one sample request.

```sh
python3 preparation/prepare-samples.py path/to/access.log
```

Current `prod-samples.txt` is based on log file `openmaps.gov.bc.ca-access.20240502.log`:

- `1,549,644` requests from May 2nd, 2024 log file, for 24hrs starting May 1st @ 5:55am
- `1,543,484` matching the regexpression
- `1,047,940` scoped to GetMap 200 requests
- `26,765` unique samples

## Running sample replay test

```sh
mkdir _tmp

locust --config ./master.replay-baseline.conf
```

Start with `10VU` - that is the most a single GeoServer Pod will support.

## Running full timed test

```sh
mkdir _tmp

BASE_PATH=/geo/pub/ows \
locust --config ./master.replay-timed.conf
```

## Comparing against baseline

```sh
mkdir -p _tmp/gscloud
locust --config ./master.compare-baseline.conf

```

## Analyzing differences

```sh
python3 analyze.py
```
