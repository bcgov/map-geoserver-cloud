import cypress, { defineConfig } from 'cypress'
import getCompareSnapshotsPlugin from 'cypress-image-diff-js/plugin'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return getCompareSnapshotsPlugin(on, config)
    },
    // // We've imported your old cypress plugins here.
    // // You may want to clean this up later by importing these.
    // setupNodeEvents(on, config) {
    //   // require('@cypress/code-coverage/task')(on, config)
    //   // // include any other plugin code...

    //   // // It's IMPORTANT to return the config object
    //   // // with any changed environment variables
    //   config.specPattern=[
    //   './cypress/tests/**/*.ts',
    // ]
    //   return config
    // },
    port: 8080,
    baseUrl: process.env.BASE_URL,
    specPattern: 'cypress/tests/**/*.cy.ts',
    numTestsKeptInMemory: 50,
    screenshotOnRunFailure: true,
    //screenshotsFolder: 'results/report/assets',
    video: false,
    testIsolation: false,
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'results',
      html: false,
      json: true,
      overwrite: false,
    },
    chromeWebSecurity: false,
    env: {},
    retries: {
      runMode: 0,
      openMode: 0,
    },
  },
})
