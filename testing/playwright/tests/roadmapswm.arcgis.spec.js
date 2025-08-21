import { test, expect } from '@playwright/test';
import restRequests from "../fixtures/roadmaps-wm-rest-requests.json";
import otherRequests from "../fixtures/roadmaps-wm-non-rest-requests.json";

const ARCGIS_PROD_DOMAIN = "http://delivery.maps.gov.bc.ca";
// const ARCGIS_PROD_DOMAIN = "http://meridiana.dmz:6080";
// const ARCGIS_PROD_DOMAIN = "http://142.34.140.15:6080"; // meridiana.dmz
// const ARCGIS_TEST_DOMAIN = "https://maps.gov.bc.ca";
const ARCGIS_TEST_DOMAIN = "https://142.34.5.8:6080"; // rivati.dmz
const NUM_REQUESTS_TO_SAMPLE = 200;

// This is so that the saved screenshot has the same name as the actual test case (which will check for a .png with the same name)
// function getTestName(requestUrl, index) {
//     let url = new URL(requestUrl);
//     return index + "-" + url.searchParams.get("layers");
// }

// This function allows us to sample requests from a uniform distribution.
function getRandomNumber(n) {
    return Math.floor(Math.random() * (n));
}

// rest requests
test.describe("rest", () => {

    // TODO: Might want to clear out the directory, so can test each.

    // requests.forEach((requestUrl, index) => {
    let numRequests = restRequests.length;
    let maxRequestIndex = numRequests - 1;
    for (let i = 0; i < NUM_REQUESTS_TO_SAMPLE; i++) {

        let requestUrl = restRequests[getRandomNumber(maxRequestIndex)];
        let prodRequestUrl = ARCGIS_PROD_DOMAIN + "/" + requestUrl;
        let testRequestUrl = ARCGIS_TEST_DOMAIN + "/" + requestUrl;
        let testName = "test-" + i;

        test(testName, async ({ page }) => {

            // Get a screenshot from production (Gold) and save it.
            await page.goto(prodRequestUrl);            
            // Path is relative to the executing directory (probably testing/playwright).
            // Refactor: Could update this to use the config parameter for the snapshots directory in playwright.config.js
            let screenshotPath = "./tests/snapshots/roadmapswm.arcgis.spec.js/rest-" + testName + "-1.png";
            await page.screenshot({ path: screenshotPath });

            // Compare against the failover on GoldDR
            await page.goto(testRequestUrl);
            await expect(page).toHaveScreenshot();
        });
    }
});

test.describe("wms-map", () => {

    // TODO: Might want to clear out the directory, so can test each.

    // requests.forEach((requestUrl, index) => {
    let numRequests = otherRequests.length;
    let maxRequestIndex = numRequests - 1;
    for (let i = 0; i < NUM_REQUESTS_TO_SAMPLE; i++) {

        let requestUrl = otherRequests[getRandomNumber(maxRequestIndex)];
        let prodRequestUrl = ARCGIS_PROD_DOMAIN + "/" + requestUrl;
        let testRequestUrl = ARCGIS_TEST_DOMAIN + "/" + requestUrl;
        let testName = "test-" + i;

        test(testName, async ({ page }) => {

            // Get a screenshot from production (Gold) and save it.
            let prodResponse = await page.goto(prodRequestUrl);            
            // Path is relative to the executing directory (probably testing/playwright).
            // Refactor: Could update this to use the config parameter for the snapshots directory in playwright.config.js
            let screenshotPath = "./tests/snapshots/roadmapswm.arcgis.spec.js/wms-map-" + testName + "-1.png";
            await page.screenshot({ path: screenshotPath });

            // Compare against the failover on GoldDR
            let testResponse = await page.goto(testRequestUrl);
            await expect(page).toHaveScreenshot();

            expect(prodResponse.status()).not.toBe(404); 
            expect(testResponse.status()).not.toBe(404);
        });
    }
});
