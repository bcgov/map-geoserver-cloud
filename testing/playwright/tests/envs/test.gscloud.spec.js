import { test, expect } from "@playwright/test";
import requests from "../../fixtures/wms-map-requests.json";
import gcRequests from "../../fixtures/wms-get-capabilities-requests";

const domain = "https://test.openmaps.gov.bc.ca";

test.describe("WMS Map", () => {

    requests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        let layerName = url.searchParams.get("layers");

    test(index + "-" + layerName, async ({ page }) => {

            await page.goto(requestUrl);
            await expect(page).toHaveScreenshot();
        });
    });
});

test.describe("WMS GetCapabilities", () => {

    gcRequests.forEach((requestUrl, index) => {

        requestUrl = domain + "/" + requestUrl;
        let url = new URL(requestUrl);
        let layerName = url.searchParams.get("LAYERS");

        test(index + "-" + layerName, async ({ page }) => {

            // Check that the get capabilities requests returns 200 and an xml document.
            let response = await page.goto(requestUrl);
            expect(response.status()).toBe(200);
            let contentType = response.headers()["content-type"];
            expect(contentType).toContain("text/xml");
        });
    });
});