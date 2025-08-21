import { test, expect } from "@playwright/test";
import cachedMapRequests from "../fixtures/wms-map-cached-layer-requests.json";

let getLcParameterValue = function (param, searchParams) {

    for (const [key, value] of searchParams) {
        if (key.toLowerCase() === param) {
            return value;
        }
    }

    return null;
}

let domain = "https://delivery.openmaps.gov.bc.ca";
let envDescription = "DEV";
if (process.env.ENV === "test") {
    domain = "https://test.openmaps.gov.bc.ca";
    envDescription = "TEST";
} else if (process.env.ENV === "prod") {
    domain = "https://openmaps.gov.bc.ca";
    envDescription = "PROD";
}

// TODO tests:
// Tests for things that don't match the query parameters ------ no "layers" query param. Nil etc. 
// Tests for different gridsets.
// Compare test url to non test url for timing? 

// Most requested layers: 
// whse_human_cultural_economic.emrg_order_and_alert_areas_sp
// whse_land_and_natural_resource.prot_current_fire_polys_sp
// whse_land_and_natural_resource.prot_bans_and_prohibitions_sp
// whse_land_and_natural_resource.prot_danger_rating_sp
// whse_land_and_natural_resource.prot_restricted_areas_sp 

test.describe("Layers are routed to GWC", () => {

    // NOTE: If bounding box is wrong for the gridset then the cache won't be hit, and the headers won't show anything, even if it's going to GWC, I believe.. must be proxying to GSC?
    let routes = [
        // whse_land_and_natural_resource.prot_current_fire_polys_sp
        "/geo/pub/ows?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/ows?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/pub/ows?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/pub/wms?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/pub/wms?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/wms?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",

        // whse_land_and_natural_resource.prot_bans_and_prohibitions_sp
        "/geo/pub/ows/?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_BANS_AND_PROHIBITIONS_SP&format=image%2Fpng&transparent=true&srs=EPSG%3A3857&width=430&height=777&bbox=-13569101.26118449,6675704.302314157,-13306157.883883484,7150836.870134808",

        // whse_land_and_natural_resource.prot_danger_rating_sp
        "/geo/pub/wms?SERVICE=WMS&?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&BBOX=-14401959.12138,6261721.35712,-13775786.98567,6887893.49283&WIDTH=256&HEIGHT=256&BGCOLOR=0xCCCCCC&TRANSPARENT=TRUE&FORMAT=image/png&EXCEPTIONS=application/vnd.ogc.se_inimage&SRS=EPSG:3857&LAYERS=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP",
        "/geo/pub/ows?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP&styles=7734&format=image%2Fpng&transparent=true&cql_filter=include&srs=EPSG%3A3857&width=375&height=585&bbox=-15879334.00407566,4500612.225431176,-12210356.646387197,10224216.903425176",

        // whse_land_and_natural_resource.prot_restricted_areas_sp
        "/geo/pub/ows/?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_RESTRICTED_AREAS_SP&styles=7735&format=image%2Fpng&transparent=true&cql_filter=include&srs=EPSG%3A3857&width=1503&height=906&bbox=-13088006.605157591,6397416.1915849,-13059285.391779436,6414729.178491495", 
        "/geo/pub/ows/?SERVICE=WMS&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&STYLES=&VERSION=1.3.0&LAYERS=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_RESTRICTED_AREAS_SP&WIDTH=412&HEIGHT=760&CRS=EPSG:3857&BBOX=-12447225.994046662,7587225.717026944,-12384241.882739652,7703410.00002046",

        // WMS Routes for: whse_human_cultural_economic.emrg_order_and_alert_areas_sp.
        "/geo/pub/ows?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625",
        "/geo/ows?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625",
        "/geo/pub/ows?&service=WMS&request=GetMap&layers=pub%3AWHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-15654303.3928041,7514065.628545967,-15028131.257091936,8140237.764258131",
        "/geo/pub/wms?&service=WMS&request=GetMap&layers=pub%3AWHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-15654303.3928041,7514065.628545967,-15028131.257091936,8140237.764258131",
        "/geo/pub/wms?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625",
        "/geo/wms?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625"
    ];

    // Construct requests for each type of service. Run in for each loop
    routes.forEach((requestUrl, index) => {

        let devRequestUrl = domain + requestUrl;
        let url = new URL(devRequestUrl);
        let path = url.pathname;
        let layers = getLcParameterValue("layers", url.searchParams);
        let srs = getLcParameterValue("srs", url.searchParams);
        let bbox = getLcParameterValue("bbox", url.searchParams);
        let href = url.href;

        test("Cache HIT: " + layers + "-" + index, 
            { 
                annotation : [
                    { 
                        type: "path", 
                        description : path
                    },
                    {
                        type: "layer", 
                        description : layers
                    },
                    {
                        type: "srs", 
                        description : srs
                    },
                    {
                        type: "bbox", 
                        description : bbox
                    },
                    {
                        type: "href", 
                        description : href
                    }
                ]
            }, 
            async ({ page }) => {
            
            let response = await page.goto(devRequestUrl);
            let headers = response.headers();

            expect(response.status()).toBe(200);
            expect(headers).toHaveProperty("geowebcache-cache-result");
            expect(headers).toHaveProperty("geowebcache-crs");
            expect(headers).toHaveProperty("geowebcache-gridset");
            expect(headers).toHaveProperty("geowebcache-tile-bounds");
            expect(headers).toHaveProperty("geowebcache-tile-index");
            expect(headers["cache-control"]).toMatch("max-age=900, must-revalidate");
            expect(headers["content-type"]).toMatch("image/png");
        });
    });
});

test.describe("GWC == GSC images", () => {

    let routes = [
        // whse_land_and_natural_resource.prot_current_fire_polys_sp
        "/geo/pub/ows?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/ows?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/pub/ows?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/pub/wms?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/pub/wms?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",
        "/geo/wms?service=WMS&request=GetMap&layers=WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&styles=1751_1752&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-12523442.714243278,2504688.542848655,-10018754.171394622,5009377.085697314",

        // whse_land_and_natural_resource.prot_bans_and_prohibitions_sp
        "/geo/pub/ows/?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_BANS_AND_PROHIBITIONS_SP&format=image%2Fpng&transparent=true&srs=EPSG%3A3857&width=430&height=777&bbox=-13569101.26118449,6675704.302314157,-13306157.883883484,7150836.870134808",

        // whse_land_and_natural_resource.prot_danger_rating_sp
        "/geo/pub/wms?SERVICE=WMS&?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&BBOX=-14401959.12138,6261721.35712,-13775786.98567,6887893.49283&WIDTH=256&HEIGHT=256&BGCOLOR=0xCCCCCC&TRANSPARENT=TRUE&FORMAT=image/png&EXCEPTIONS=application/vnd.ogc.se_inimage&SRS=EPSG:3857&LAYERS=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP",
        "/geo/pub/ows?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP&styles=7734&format=image%2Fpng&transparent=true&cql_filter=include&srs=EPSG%3A3857&width=375&height=585&bbox=-15879334.00407566,4500612.225431176,-12210356.646387197,10224216.903425176",

        // whse_land_and_natural_resource.prot_restricted_areas_sp
        "/geo/pub/ows/?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_RESTRICTED_AREAS_SP&styles=7735&format=image%2Fpng&transparent=true&cql_filter=include&srs=EPSG%3A3857&width=1503&height=906&bbox=-13088006.605157591,6397416.1915849,-13059285.391779436,6414729.178491495", 
        "/geo/pub/ows/?SERVICE=WMS&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&STYLES=&VERSION=1.3.0&LAYERS=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_RESTRICTED_AREAS_SP&WIDTH=412&HEIGHT=760&CRS=EPSG:3857&BBOX=-12447225.994046662,7587225.717026944,-12384241.882739652,7703410.00002046",

        // WMS Routes for: whse_human_cultural_economic.emrg_order_and_alert_areas_sp.
        "/geo/pub/ows?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625",
        "/geo/ows?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625",
        "/geo/pub/ows?&service=WMS&request=GetMap&layers=pub%3AWHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-15654303.3928041,7514065.628545967,-15028131.257091936,8140237.764258131",
        "/geo/pub/wms?&service=WMS&request=GetMap&layers=pub%3AWHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image%2Fpng&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG%3A3857&bbox=-15654303.3928041,7514065.628545967,-15028131.257091936,8140237.764258131",
        "/geo/pub/wms?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625",
        "/geo/wms?=&service=WMS&request=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625"
    ];

    routes.forEach((requestUrl, index) => {

        let gwcRequestUrl = domain + requestUrl;
        let devRequestUrl = domain + "/test" + requestUrl;
        let url = new URL(devRequestUrl);
        let path = url.pathname;
        let layers = getLcParameterValue("layers", url.searchParams);
        let srs = getLcParameterValue("srs", url.searchParams);
        let bbox = getLcParameterValue("bbox", url.searchParams);
        let gscHref = url.href;
        let gwcHref = new URL(gwcRequestUrl).href;

        let testName = "gwc-comparison-" + index
        test(testName,  
            { 
                annotation : [
                    { 
                        type: "path", 
                        description : path
                    },
                    {
                        type: "layer", 
                        description : layers
                    },
                    {
                        type: "srs", 
                        description : srs
                    },
                    {
                        type: "bbox", 
                        description : bbox
                    },
                    {
                        type: "Geoserver Cloud href", 
                        description : gscHref
                    },
                    {
                        type: "Geowebcache href", 
                        description : gwcHref
                    }
                ]
            }, 
            async ({ page }) => {

            // Get a screenshot from GWC and save it.
            await page.goto(gwcRequestUrl);            
            // Path is relative to the executing directory (probably testing/playwright).
            // Refactor: Could update this to use the config parameter for the snapshots directory in playwright.config.js
            let screenshotPath = "./tests/snapshots/gwc.gscloud.spec.js/GWC-GSC-images-" + testName + "-1.png";
            await page.screenshot({ path: screenshotPath });

            // Compare against the /test url that is direct to Geoserver.
            await page.goto(devRequestUrl);
            await expect(page).toHaveScreenshot();
        });
    });
});

test.describe("&tiled=true query param behaviour", () => {

    cachedMapRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        let path = url.pathname;
        let layerName = getLcParameterValue("layers", url.searchParams);
        let srs = getLcParameterValue("srs", url.searchParams);
        let bbox = getLcParameterValue("bbox", url.searchParams);
        let href = url.href;

        test("is cached with tiled=true " + index + "-" + layerName, 
            { 
                annotation : [
                    { 
                        type: "path", 
                        description : path
                    },
                    {
                        type: "layer", 
                        description : layerName
                    },
                    {
                        type: "srs", 
                        description : srs
                    },
                    {
                        type: "bbox", 
                        description : bbox
                    },
                    {
                        type: "href", 
                        description : href
                    }
                ]
            },
            async ({ page }) => {

            let response = await page.goto(requestUrl);
            let headers = response.headers();

            expect(response.status()).toBe(200);
            expect(headers).toHaveProperty("geowebcache-cache-result");
            expect(headers).toHaveProperty("geowebcache-crs");
            expect(headers).toHaveProperty("geowebcache-gridset");
            expect(headers).toHaveProperty("geowebcache-tile-bounds");
            expect(headers).toHaveProperty("geowebcache-tile-index");
            expect(headers["cache-control"]).toMatch("max-age=900, must-revalidate");
            expect(headers["content-type"]).toMatch("image/png");
        });
    });

    cachedMapRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        requestUrl = url.toString();
        url.searchParams.delete("tiled");
        let path = url.pathname;
        let layerName = getLcParameterValue("layers", url.searchParams);
        let srs = getLcParameterValue("srs", url.searchParams);
        let bbox = getLcParameterValue("bbox", url.searchParams);
        let href = url.href;

        test("is cached without tiled=true " + index + "-" + layerName, 
            { 
                annotation : [
                    { 
                        type: "path", 
                        description : path
                    },
                    {
                        type: "layer", 
                        description : layerName
                    },
                    {
                        type: "srs", 
                        description : srs
                    },
                    {
                        type: "bbox", 
                        description : bbox
                    },
                    {
                        type: "href", 
                        description : href
                    }
                ]
            },
            async ({ page }) => {

            let response = await page.goto(requestUrl);
            let headers = response.headers();

            expect(response.status()).toBe(200);
            expect(headers).toHaveProperty("geowebcache-cache-result");
            expect(headers).toHaveProperty("geowebcache-crs");
            expect(headers).toHaveProperty("geowebcache-gridset");
            expect(headers).toHaveProperty("geowebcache-tile-bounds");
            expect(headers).toHaveProperty("geowebcache-tile-index");
            expect(headers["cache-control"]).toMatch("max-age=900, must-revalidate");
            expect(headers["content-type"]).toMatch("image/png");
        });
    });
});

test.describe("No cache headers if request is routed to Geoserver", () => {

    cachedMapRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        url.pathname = "/test/geo/pub/wms";
        requestUrl = url.toString();
        let path = url.pathname;
        let layerName = getLcParameterValue("layers", url.searchParams);
        let srs = getLcParameterValue("srs", url.searchParams);
        let bbox = getLcParameterValue("bbox", url.searchParams);
        let href = url.href;

        test(index + "-" + layerName, 
            { 
                annotation : [
                    { 
                        type: "path", 
                        description : path
                    },
                    {
                        type: "layer", 
                        description : layerName
                    },
                    {
                        type: "srs", 
                        description : srs
                    },
                    {
                        type: "bbox", 
                        description : bbox
                    },
                    {
                        type: "href", 
                        description : href
                    },
                ]
            },
            async ({ page }) => {

            let response = await page.goto(requestUrl);
            let headers = response.headers();

            expect(response.status()).toBe(200);
            expect(headers).toHaveProperty("geowebcache-cache-result");
            expect(headers).toHaveProperty("geowebcache-miss-reason");
            expect(headers).not.toHaveProperty("geowebcache-crs");
            expect(headers).not.toHaveProperty("geowebcache-gridset");
            expect(headers).not.toHaveProperty("geowebcache-tile-bounds");
            expect(headers).not.toHaveProperty("geowebcache-tile-index");
            expect(headers).not.toHaveProperty("cache-control");
            expect(headers["content-type"]).toMatch("image/png"); 
        });
    });
});


