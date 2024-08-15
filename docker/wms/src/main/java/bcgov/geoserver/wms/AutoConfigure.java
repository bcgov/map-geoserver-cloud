package bcgov.geoserver.wms;

// import org.geoserver.catalog.Catalog;
// import org.geoserver.cloud.autoconfigure.gwc.integration.WMSIntegrationAutoConfiguration;
// import org.geoserver.cloud.config.factory.FilteringXmlBeanDefinitionReader;
// import org.geoserver.cloud.virtualservice.VirtualServiceVerifier;
// import org.geoserver.cloud.wms.controller.GetMapReflectorController;
// import org.geoserver.cloud.wms.controller.WMSController;
// import org.geoserver.config.GeoServer;
// import org.geoserver.ows.Dispatcher;
// import org.geoserver.platform.GeoServerResourceLoader;
// import org.geoserver.wfs.xml.FeatureTypeSchemaBuilder;
// import org.geoserver.wfs.xml.v1_1_0.WFS;
// import org.geoserver.wfs.xml.v1_1_0.WFSConfiguration;
// import org.geoserver.wms.capabilities.GetCapabilitiesTransformer;
// import org.geoserver.wms.capabilities.LegendSample;
// import org.geoserver.wms.capabilities.LegendSampleImpl;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ImportResource;

// auto-configure before GWC's wms-integration to avoid it precluding to load beans from
// jar:gs-wms-.*
@ImportResource({"classpath*:applicationContext.xml"})
public class AutoConfigure {

}