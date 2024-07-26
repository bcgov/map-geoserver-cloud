#!/bin/bash

envsubst </overrides/webapps/gwc/WEB-INF/geowebcache-core-context.xml > /usr/local/tomcat/webapps/gwc/WEB-INF/geowebcache-core-context.xml
envsubst </overrides/webapps/gwc/WEB-INF/geowebcache-wmsservice-context.xml > /usr/local/tomcat/webapps/gwc/WEB-INF/geowebcache-wmsservice-context.xml

envsubst </overrides/cache/geowebcache.xml > /geowebcache/cache/geowebcache.xml

catalina.sh "run"