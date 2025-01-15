
describe('Loop through real calls (batch 3)', () => {
  it('Matches the current environment', () => {
    cy.fixture('prod-samples-good.txt').then((calls) => {
      calls.split('\n').forEach((call: any, index: number) => {
          const info = JSON.parse(call);
          cy.request(info['uri']).then(() => {
            cy.compareSnapshot({ name: `call-batch-3-${index + 1}`, testThreshold: 0.2 })
          })
      })
    })
  })
})
