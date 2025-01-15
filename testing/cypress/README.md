# Cypress Test Automation Framework

## Executing suite of tests in Docker

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
npm run cy:run:noexit
```

## Image Comparison

```
npm run cy:imgdiff
```

## Run interactively in a browser

```
npm run cy:open
```