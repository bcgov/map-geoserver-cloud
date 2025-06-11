# Playwright testing for Geoserver Cloud

The following is an overview of the installation, configuration and usage of Geoserver Cloud's (GS Cloud) end-to-end testing infrastructure.

## Relevant links

* The Map team's [Geoserver Cloud](https://dpdd.atlassian.net/wiki/spaces/DevOps/pages/618758184/GeoServer+Cloud)
* [Geoserver](https://geoserver.org/)
* [Geoserver testing strategy](https://dpdd.atlassian.net/wiki/spaces/DevOps/pages/1189183502/GS+Cloud+testing+strategy)
* [Playwright](https://playwright.dev/)
* [End-to-end testing](https://en.wikipedia.org/wiki/System_testing)

## Table of contents

1. [Relevant Links](#relevant-links)
2. [Setting up the Test Environment](#setting-up-the-test-environment)
   - [Geoserver Cloud](#geoserver-cloud)
   - [Dependencies](#dependencies)
   - [Playwright](#playwright)
3. [Configuration](#configuration)
   - [Test Targets](#test-targets)
   - [Screenshots and Image Comparison Tests](#screenshots-and-image-comparison-tests)
   - [Reporters](#reporters)
4. [Running Tests](#running-tests)
   - [Examples](#examples)

## Setting up the test environment

The intention for GS Cloud testing infrastructure is to keep it as close to defaults as possible so that the available Playwright documentation is sufficient for getting started. 

### Geoserver Cloud

Clone the [GS Cloud project](https://github.com/bcgov/map-geoserver-cloud) to a local repo.

As of this writing, test infrastructure code can be found in a [feature branch, here](feature/test-automation-playwright).

Test code will eventually be merged into the main branch.

### Dependencies

Playwright requires an installation of the [Node.js toolchain](https://nodejs.org/en/download), including node, npm and npx. Install a suitable version on your machine. A package manager such as Homebrew (osx) can be used for this purpose. 

### Playwright

[Install Playwright](https://playwright.dev/docs/intro#installing-playwright) according to the default instructions, and review the intallation and configuration page. 

Playwright installs with a default project folder structure, config files, and examples. These are already included in the GS Cloud testing folder, so the default install can be removed.

## GS Cloud testing file structure

`testing`: Playwright (E2E) & Locust (load testing) parent directory
`testing/playwright`: E2E testing
`testing/playwright/fixtures`: URL requests to Geoserver used in test cases. Add a request to include it in testing.
`testing/playwright/tests`: Parent directory for Playwright specs.

### `tests` directory

`envs/`: Contains .spec.js files for base Geoserver tests.
`failover.gscloud.spec.js`: Tests to ensure Gold and GoldDR are in sync.
`ratelimiting.gscloud.spec.js`: Tests to check configuration of rate limiting plugin for GS Cloud APS routes. Requires resetting environment rate limit to something that the test can hit.

## Configuration

GS Cloud testing uses a fairly standard Playwright configuration, found in the `./testing/playwright/playwright.config.js` file.

The following describes some key configuration considerations.

### Test targets

A Playwright design goal is to provide a comprehensive set of test targets (browsers, browser engines, screen types and devices). Test targets can be configured within the `projects` section of the `playwright.config.js` file. 

For example, this shows chromium devices on desktop Chrome are not a target, while Desktop Firefox is. All tests will be run for Firefox only. Remove the chromium comments to have Playwright run tests for both targets. 

```
// {
//   name: 'chromium',
//   use: { ...devices['Desktop Chrome'] },
// },

{
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
},
```

### Screenshots and image comparison tests

Geoserver testing involves a significant amount of image comparison, for WMS map requests, for example. 

Playwright has built-in visual comparison features. Review the [guide](https://playwright.dev/docs/test-snapshots).

The location of base images for comparison can be relative to the grouping/test cases, and can be configured in playwright.config.js: 

```
// Path for snapshots
snapshotPathTemplate: '{testDir}/snapshots/{testFilePath}/{arg}{ext}',
```

This configuration will look for/place base images for comparison at `../playwright/tests/snapshots/{test file path/name}/{test name}`

### Reporters

Playwright can be configured to generate reports in a variety of different ways, and to different output targets (console, browser etc.).

The default is to generate an HTML report that can be read in the browser - and only in the case that tests fail.

If tests succeed, the result is output to the console, with an associated command to open the HTML report if required. 

All of this behaviour can be configured, [described here](https://playwright.dev/docs/test-reporters).

## Running tests

GS Cloud testing is organized so that [standard Playwright commands](https://playwright.dev/docs/test-cli) can be used to run tests, or a subset of tests. There are many different options for running specific tests, groups of tests, all tests in a single file, or all tests in a directory.

### GS Cloud examples

1. Run base GS Cloud development tests
`./testing/playwright/tests % npx playwright test envs/dev.gscloud.spec.js`
2. Run base GS Cloud production tests
`./testing/playwright/tests % npx playwright test envs/prod.gscloud.spec.js`
3. Run ALL base GS Cloud tests
`./testing/playwright/tests % npx playwright test envs`
4. Run Gold -> GoldDR failover tests
`./testing/playwright % failover.gscloud.spec.js`
