const { chromium } = require("playwright");
const fs = require("node:fs");
const summerOpenmapsRequests = require("../../fixtures/openmaps_summer_2024.json");

function getRandomNumber(n) {
    return Math.floor(Math.random() * (n));
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    let responseStats = {
        totalRequests: 0,
        successfulResponses: 0,
        failedResponses: 0,
        cacheHits: 0,
        responseTimes: [],
        failedURLs: [],
        failureCode : []
    };

    for (let i = 0; i < NUM_REQUESTS_TO_SAMPLE; i++) {
        const requestUrl = summerOpenmapsRequests[getRandomNumber(summerOpenmapsRequests.length)];
        const fullUrl = domain + requestUrl;

        try {
            const startTime = Date.now();
            const response = await page.goto(fullUrl);
            const endTime = Date.now();

            responseStats.totalRequests++;
            responseStats.responseTimes.push(endTime - startTime);

            if (response.status() === 200) {
                responseStats.successfulResponses++;

                let headers = response.headers();
                if (headers["geowebcache-cache-result"] !== undefined) {
                    responseStats.cacheHits++;
                }
            } else {
                responseStats.failedResponses++;
                responseStats.failedURLs.push(fullUrl);
                responseStats.failureCode.push(response.status());
            }
        } catch (error) {
            responseStats.failedResponses++;
            responseStats.failedURLs.push(fullUrl);
            responseStats.failureCode.push("???");
            // console.log(`Error for URL ${fullUrl}: ${error.message}`);
        }
    }

    await browser.close();

    // Calculate summary statistics
    const avgResponseTime =
        responseStats.responseTimes.reduce((a, b) => a + b, 0) /
        responseStats.responseTimes.length;

    console.log("Summary Statistics:");
    console.log(`Total Requests: ${responseStats.totalRequests}`);
    console.log(`Successful Responses: ${responseStats.successfulResponses}`);
    console.log(`Failed Responses: ${responseStats.failedResponses}`);
    console.log(`Cache hits on success: ${responseStats.cacheHits}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)} ms`);

    // Extract paths only, and query parameter if they exist. 
    for (let i = 0; i < responseStats.failedURLs.length; i++) {
        let failedUrl = responseStats.failedURLs[i];

        // Check to see if the layer name is in the path first - many of these requests also have a layerName query parameter.
        let layerName = "";
        let regex = /\/geo\/pub\/([^/]+)\/(?:wms|ows)/;
        let match = failedUrl.match(regex);
        if (match) {
            layerName = match[1];
        }

        let url = new URL(failedUrl);
        if (layerName !== "") {
            layerName = url.searchParams.get("layers");
        }
        let requestType = url.searchParams.get("request");

        console.log(i + " -- " + responseStats.failureCode[i] + " -- " + url.pathname + "  --  " + layerName + " -- " + requestType);
    }

    // Add a line number to correspond to what is printed to the console above for the failure code -- pathname -- etc. 
    for (let i = 0; i < responseStats.failedURLs.length; i++) {
        responseStats.failedURLs[i] = i + " -- " + responseStats.failedURLs[i];
    }

    fs.writeFile("./failed-urls.txt", responseStats.failedURLs.join("\n----\n"), err => {
        if (err) {
            console.error(err);
        }
    });
})();