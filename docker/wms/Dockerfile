FROM maven:latest AS BUILD

WORKDIR /app
COPY . .
RUN mvn package

FROM geoservercloud/geoserver-cloud-wms:1.9-SNAPSHOT

COPY --from=BUILD /app/target/gs-wms-bcgov-2.26.0.jar /opt/app/bin/BOOT-INF/lib/.
