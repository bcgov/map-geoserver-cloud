# Cypress Test Automation Framework

## Executing suite of tests

Build the images:

```sh
docker compose --profile openmap build
```

Prepare the temp folder for holding cypress outputs

```sh
mkdir -p _tmp/results _tmp/coverage
```

Then choose one of `openmap` or `gscloud`:

- `docker compose --profile openmap up`
- `docker compose --profile gscloud up`

## Test development

```sh
cd e2e
npm i
BASE_URL=http://localhost:3000 npm run cy:run:noexit
```

## Image Comparison

```
BASE_URL=http://localhost:3000 npm run cy:imgdiff
```
