describe('Loop through real calls (batch 2)', () => {
  it('Matches the current environment', () => {
    cy.fixture('common-calls-2.txt').then((calls) => {
      calls.split('\n').forEach((call: any, index: number) => {
        if (index < 10 && !call.startsWith('SKIP')) {
          cy.request(call).then(() => {
            cy.compareSnapshot({ name: `call-batch-2-${index + 1}`, testThreshold: 0.2 })
          })
        }
      })
    })
  })
})
