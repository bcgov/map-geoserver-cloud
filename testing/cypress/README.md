# Cypress Test Automation Framework

## Executing suite of tests

```sh
docker compose --profile openmap build
docker compose --profile openmap up

docker compose --profile gscloud up
```

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
