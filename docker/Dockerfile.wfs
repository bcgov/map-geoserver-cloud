FROM maven:latest AS BUILD

WORKDIR /app
RUN git clone -b 2.25.3 --depth 1 https://github.com/geoserver/geoserver.git

WORKDIR /app/geoserver/src/community/xslt
RUN mvn package

FROM geoservercloud/geoserver-cloud-wfs:1.9-SNAPSHOT

COPY --from=BUILD /app/geoserver/src/community/xslt/target/gs-xslt-2.25.3.jar /opt/app/bin/BOOT-INF/lib/.
