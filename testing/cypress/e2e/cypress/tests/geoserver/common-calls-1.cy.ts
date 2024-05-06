describe('Loop through real calls', () => {
  it('Matches the current environment', () => {
    cy.fixture('common-calls-1.json').then((calls) => {
      calls.active.forEach((call: any, index: number) => {
        cy.visit(call.uri).then(() => {
          cy.compareSnapshot({name: `call-batch-1-${index}`, testThreshold: 0.2 })
        })
      })
    })
  })
})
