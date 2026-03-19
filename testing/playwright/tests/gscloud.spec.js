import { test, expect } from "@playwright/test";
import wmsMapRequests from "../fixtures/wms-map-requests.json";
import wmsGetCapRequests from "../fixtures/wms-get-capabilities-requests.json";
import wfsFeatureRequests from "../fixtures/wfs-feature-requests.json";

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

test.describe(envDescription + " routes", () => {

    // This query string has the "layers" parameter.
    let queryString = "?STYLES=&layers=pub%3AWHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP&WIDTH=400&service=wms&FORMAT=image%2Fpng&request=getmap&HEIGHT=266&SRS=EPSG%3A3005&version=1.1.1&BBOX=794280.590063033%2C264941.75762325%2C1636273.15489024%2C888458.117582758";
    // let noLayerQueryString = "?STYLES=&WIDTH=400&service=wms&FORMAT=image%2Fpng&request=getmap&HEIGHT=266&SRS=EPSG%3A3005&version=1.1.1&BBOX=794280.590063033%2C264941.75762325%2C1636273.15489024%2C888458.117582758";

    // This fails on VM
    // http://imai.dmz:8080/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=pub%3AWHSE_ADMIN_BOUNDARIES.ADM_NR_AREAS_SPG&STYLES&SRS=EPSG%3A3005&WIDTH=769&HEIGHT=661&BBOX=837117.4175197755%2C846890.4045174526%2C1306831.6050956289%2C1250636.929858986
    // test("/geo/pub/[layername]/wms", async ({ page }) => {

    //     let path = "/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP/wms"
    //     let requestUrl = domain + path + queryString;
    
    //     let response = await page.goto(requestUrl);
    //     await expect(response.status()).toBe(200);
    //     await expect(page).toHaveScreenshot();
    // });

    // This fails on VM
    // http://imai.dmz:8080/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP/ows?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=pub%3AWHSE_ADMIN_BOUNDARIES.ADM_NR_AREAS_SPG&STYLES&SRS=EPSG%3A3005&WIDTH=769&HEIGHT=661&BBOX=837117.4175197755%2C846890.4045174526%2C1306831.6050956289%2C1250636.929858986
    // test("/geo/pub/[layername]/ows", async ({ page }) => {

    //     let path = "/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP/ows"
    //     let requestUrl = domain + path + queryString;
    
    //     let response = await page.goto(requestUrl);
    //     await expect(response.status()).toBe(200);
    //     await expect(page).toHaveScreenshot();
    // });

    // These two fail - they build on the two previous tests, which fail
    // test("/geo/pub/[layername]/wms NO &layers=", async ({ page }) => {

    //     let path = "/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP/wms"
    //     let requestUrl = domain + path + noLayerQueryString;
        
    //     try {
    //         let response = await page.goto(requestUrl);
    //         await expect(response.status()).toBe(200);
    //     }
    //     catch (error) {
    //         expect(error.message).toContain("Download is starting");
    //     }
    // });

    // test("/geo/pub/[layername]/ows NO &layers=", async ({ page }) => {

    //     let path = "/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_COUNTIES_SP/ows"
    //     let requestUrl = domain + path + noLayerQueryString;

    //     try {
    //         let response = await page.goto(requestUrl);
    //         await expect(response.status()).toBe(200);
    //     }
    //     catch (error) {
    //         expect(error.message).toContain("Download is starting");
    //     }
    // });

    test("/geo/pub/wms", async ({ page }) => {

        let path = "/geo/pub/wms"
        let requestUrl = domain + path + queryString;
    
        let response = await page.goto(requestUrl);
        await expect(response.status()).toBe(200);
        await expect(page).toHaveScreenshot();
    });

    test("/geo/pub/ows", async ({ page }) => {

        let path = "/geo/pub/ows"
        let requestUrl = domain + path + queryString;
    
        let response = await page.goto(requestUrl);
        await expect(response.status()).toBe(200);
        await expect(page).toHaveScreenshot();
    });

    test("/geo/wms", async ({ page }) => {

        let path = "/geo/wms"
        let requestUrl = domain + path + queryString;
    
        let response = await page.goto(requestUrl);
        await expect(response.status()).toBe(200);
        await expect(page).toHaveScreenshot();
    });

    test("/geo/ows", async ({ page }) => {

        let path = "/geo/ows"
        let requestUrl = domain + path + queryString;
    
        let response = await page.goto(requestUrl);
        await expect(response.status()).toBe(200);
        await expect(page).toHaveScreenshot();
    });
});

test.describe(envDescription + " WFS GetFeature", () => {

    wfsFeatureRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        let path = url.pathname;
        let href = url.href;

        test(index, 
            { 
                annotation : [
                    { 
                        type: "path", 
                        description : path
                    },
                    {
                        type: "href", 
                        description : href
                    }
                ]
            },
            async ({ page }) => {

            let response = await page.goto(requestUrl);
            expect(response.status()).toBe(200);
            let contentType = response.headers()["content-type"];
            expect(contentType).toContain("application/json");
        });
    });
});

test.describe(envDescription + " WMS GetMap", () => {

    wmsMapRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
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
                    }
                ]
            },
            async ({ page }) => {

            await page.goto(requestUrl);
            await expect(page).toHaveScreenshot();
        });
    });
});

test.describe(envDescription + " WMS GetCapabilities", () => {

    wmsGetCapRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        // let layerName = url.searchParams.get("LAYERS");
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
                    }
                ]
            },
            async ({ page }) => {

            // Check that the get capabilities requests returns 200 and an xml document.
            let response = await page.goto(requestUrl);
            expect(response.status()).toBe(200);
            let contentType = response.headers()["content-type"];
            expect(contentType).toContain("text/xml");
        });
    });
});

// Case sensitivity tests for OWS query parameters and values so that the behaviour of GWC and Geoserver is defined in testing.
test.describe(envDescription + " Case sensitivity", () => {

    test("GSC: request param is NOT case sensitive", async ({ page }) => {

        let requestUrl = domain + "/geo/pub/wms?=&service=WMS&REQUEST=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";
        let response = await page.goto(requestUrl);

        expect(response.status()).toBe(200);
    });

    test("GSC: request value is NOT case sensitive", async ({ page }) => {

        let requestUrl = domain + "/geo/pub/wms?=&service=WMS&request=GETMAP&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";
        let response = await page.goto(requestUrl);

        expect(response.status()).toBe(200);
    });

    // These are the same tests as the previous two
    // test("GWC: request param is NOT case sensitive", async ({ page }) => {

    //     let requestUrl = domain + "/geo/pub/wms?=&service=WMS&REQUEST=GetMap&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";
    //     let response = await page.goto(requestUrl);

    //     expect(response.status()).toBe(200);
    // });

    // test("GWC: request value is NOT case sensitive", async ({ page }) => {

    //     let requestUrl = domain + "/geo/pub/wms?=&service=WMS&request=GETMAP&layers=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";
    //     let response = await page.goto(requestUrl);

    //     expect(response.status()).toBe(200);
    // });

    test("GSC: layers param is NOT case sensitive", async ({ page }) => {

        let requestUrl = domain + "/geo/pub/wms?=&service=WMS&request=GetMap&LAYERS=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";
        let response = await page.goto(requestUrl);

        expect(response.status()).toBe(200);
    });

    // This fails on VM
    // http://imai.dmz:8080/geo/pub/wms?=&service=WMS&request=GetMap&layers=pub:whse_human_cultural_economic.emrg_order_and_alert_areas_sp&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625
    // test("GSC: layers value IS case sensitive", async ({ page }) => {

    //     let requestUrl = domain + "/geo/pub/wms?=&service=WMS&request=GetMap&layers=pub:whse_human_cultural_economic.emrg_order_and_alert_areas_sp&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";

    //     try {
    //         await page.goto(requestUrl);
    //     }
    //     catch (error) {
    //         expect(error.message).toContain("Download is starting");
    //     }
    // });

    test("GWC: layers param is NOT case sensitive", async ({ page }) => {

        let requestUrl = domain + "/geo/pub/wms?=&service=WMS&request=GetMap&LAYERS=pub:WHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";
        let response = await page.goto(requestUrl);

        expect(response.status()).toBe(200);
    });

    // This is the same test as "GSC: layers value IS case sensitive"
    // test("GWC: layers value IS case sensitive", async ({ page }) => {

    //     let requestUrl = domain + "/geo/pub/wms?=&service=WMS&request=GetMap&layers=pub:whse_human_cultural_economic.emrg_order_and_alert_areas_sp&styles=&format=image/png&transparent=true&version=1.1.0&width=256&height=256&srs=EPSG:4326&tiled=true&bbox=-120.234375,49.921875,-120.05859375,50.09765625";

    //     try {
    //         await page.goto(requestUrl);
    //     }
    //     catch (error) {
    //         expect(error.message).toContain("Download is starting");
    //     }
    // });
});

