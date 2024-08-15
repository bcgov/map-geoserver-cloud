# WMS Customizations

## Build

```
docker build --tag gscloud-bcgov .
docker run gscloud-bcgov
```

## Background

There is some WFS configuration in the `applicationContext.xml` file:

`https://github.com/geoserver/geoserver/blob/main/src/wfs/src/main/java/applicationContext.xml`

That is loaded into `gscloud` WMS here:

`https://github.com/geoserver/geoserver-cloud/blob/main/src/apps/geoserver/wms/src/main/java/org/geoserver/cloud/autoconfigure/wms/WmsApplicationAutoConfiguration.java#L36`

One bean that is relevant for `DescribeLayer` is:

```xml
    <bean id="wfsLocalWorkspaceURLManger" class="org.geoserver.ows.LocalWorkspaceURLMangler">
      <constructor-arg value="wfs"/>
    </bean>
```

And potentially:

```xml
	<bean id="srsNameKvpParser" class="org.geoserver.wfs.kvp.SrsNameKvpParser"/>
```