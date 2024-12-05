const uri =
  '/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP/ows?LAYERS=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&service=WMS&request=GetCapabilities&version=1.3.0'

describe('WMS GetCapabilities', () => {
  it('Successfully gets for a specific layer', () => {
    cy.visit(uri)
  })
})
