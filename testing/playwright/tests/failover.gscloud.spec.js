import { test, expect } from '@playwright/test';
import requests from '../fixtures/wms-map-requests.json';
import gcRequests from "../fixtures/wms-get-capabilities-requests.json";

const productionDomain = "https://openmaps.gov.bc.ca";
const failoverDomain = "https://geoserver-ec38a0-prod.apps.golddr.devops.gov.bc.ca"

// This is so that the saved screenshot has the same name as the actual test case (which will check for a .png with the same name)
function getTestName(requestUrl, index) {
    let url = new URL(requestUrl);
    return index + "-" + url.searchParams.get("layers");
}

test.describe("WMS Map Gold == GoldDR", () => {

    // TODO: Might want to clear out the directory, so can test each.

    requests.forEach((requestUrl, index) => {

        let prodRequestUrl = productionDomain + "/" + requestUrl;
        let failoverRequestUrl = failoverDomain + "/" + requestUrl;
        let testName = getTestName(prodRequestUrl, index);

        test(testName, async ({ page }) => {

            // Get a screenshot from production (Gold) and save it.
            await page.goto(prodRequestUrl);            
            // Path is relative to the executing directory (probably testing/playwright).
            // Refactor: Could update this to use the config parameter for the snapshots directory in playwright.config.js
            let screenshotPath = "./tests/snapshots/" + testName + ".png";
            await page.screenshot({ path: screenshotPath });

            // Compare against the failover on GoldDR
            await page.goto(failoverRequestUrl);
            await expect(page).toHaveScreenshot();
        });
    });
});

test.describe("WMS GetCapabilities Gold == GoldDR", () => {

    gcRequests.forEach((requestUrl, index) => {

        let prodRequestUrl = productionDomain + "/" + requestUrl;
        let failoverRequestUrl = failoverDomain + "/" + requestUrl;

        test(index, async ({ page }) => {

            let goldResponse = await page.goto(prodRequestUrl);
            let goldDRResponse = await page.goto(failoverRequestUrl);
            expect(goldResponse.status()).toBe(200);
            expect(goldDRResponse.status()).toBe(200);

            // Use direct string comparison for xml docs. TODO: This could also be done with hashing (crypto.subtle.digest()) if that made sense.
            let goldBody = await goldResponse.text();
            let goldDRBody = await goldDRResponse.text();
            expect(goldBody).toBe(goldDRBody);
        });
    });
});