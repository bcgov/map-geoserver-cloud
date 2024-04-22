describe('Loop through real calls', () => {
  it('Matches the current environment', () => {
    cy.fixture('common-calls-1.json').then((calls) => {
      calls.active.forEach((call: any, index: number) => {
        cy.visit(call.uri.substring(4)).then(() => {
          cy.compareSnapshot(`call-batch-1-${index}`)
        })
      })
    })
  })
})
