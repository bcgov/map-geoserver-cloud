import { test, expect } from "@playwright/test";

const deliveryDomain = "https://delivery.openmaps.gov.bc.ca";
const testRequestUrl = "geo/pub/ows?service=WMS&request=GetMap&version=1.1.1&layers=pub%3AWHSE_HUMAN_CULTURAL_ECONOMIC.EMRG_ORDER_AND_ALERT_AREAS_SP&styles=6885&format=image%2Fpng&transparent=true&cql_filter=ORDER_ALERT_STATUS%20%3C%3E%20%27All%20Clear%27%20and%20EVENT_TYPE%20%3D%20%27Fire%27&srs=EPSG%3A3857&width=338&height=571&bbox=-13535072.4517,6490186.8574,-13533457.7194,6492914.7038";
const RATE_LIMIT_PER_MINUTE = 25;
const LIMIT_FACTOR = 3;

test.describe("Rate limiting", () => {

    test("At least one request was rate limited", async ({ page }) => {

        // Set test timeout to 2 minutes, otherwise synchronous request loop cannot generate enough requests before test times out.
        test.setTimeout(120000);

        let numRateLimitedResponses = 0;
        let numRequests = RATE_LIMIT_PER_MINUTE * LIMIT_FACTOR;
        for (let i = 0; i < numRequests; i++) {

            let requestUrl = deliveryDomain + "/" + testRequestUrl;
            let response = await page.goto(requestUrl);
            if (response.status() === 429) {
                numRateLimitedResponses += 1;
            }
        }

        // Compare images from openmaps with failover cluster.
        expect(numRateLimitedResponses).toBeGreaterThan(0);

        // Add additional information to the test report.
        test.info().annotations.push({
            type: "Number of requests against rate limit",
            description: numRequests
        });
        test.info().annotations.push({
            type: "Number of 429 responses (too many requests)",
            description: numRateLimitedResponses
        });
    });
});