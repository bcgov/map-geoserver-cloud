# geokml

Simple Express app that services files from a static folder `/app/www`.

## Development

```sh
docker build --tag geokml.local -f ../Dockerfile.geokml .
```

```sh
docker run -ti --rm --name geokml \
  -v `pwd`/_tmp:/app/www \
  -p 8000:8000 geokml.local
```
