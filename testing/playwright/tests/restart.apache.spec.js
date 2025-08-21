import { test, expect } from '@playwright/test';
import restRequests from "../fixtures/roadmaps-wm-rest-requests.json";
import otherRequests from "../fixtures/roadmaps-wm-non-rest-requests.json";

const ARCGIS_PROD_DOMAIN = "http://maps.gov.bc.ca";
// const ARCGIS_PROD_DOMAIN = "http://142.34.140.15:6080"; // meridiana.dmz
// const ARCGIS_TEST_DOMAIN = "https://maps.gov.bc.ca";
// const ARCGIS_TEST_DOMAIN = "https://142.34.5.8:6080"; // rivati.dmz
// const ARCGIS_DEV_DOMAIN = "https://delivery.maps.gov.bc.ca";
const NUM_REQUESTS_TO_SAMPLE = 200;

// This function allows us to sample requests from a uniform distribution.
function getRandomNumber(n) {
    return Math.floor(Math.random() * (n));
}

// rest requests
test.describe("restart", () => {

    // TODO: Might want to clear out the directory, so can test each.

    // requests.forEach((requestUrl, index) => {
    let numRequests = otherRequests.length;
    let maxRequestIndex = numRequests - 1;
    for (let i = 0; i < NUM_REQUESTS_TO_SAMPLE; i++) {

        let requestUrl = otherRequests[getRandomNumber(maxRequestIndex)];
        let devRequestUrl = ARCGIS_PROD_DOMAIN + "/" + requestUrl;
        // let testRequestUrl = ARCGIS_TEST_DOMAIN + "/" + requestUrl;
        // let testName = "test-" + i;
        // let devRequestUrl = "http://delivery.maps.gov.bc.ca/arcgis/rest/services/province/roads_wm/MapServer/tile/12/1388/722";
        let testName = "test-" + i;

        test(testName, async ({ page }) => {

            // Get a screenshot from production (Gold) and save it.
            let response = await page.goto(devRequestUrl);            
            expect(response.status()).toBe(200);
        });
    }
});
