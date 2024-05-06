describe('Get simple image', () => {
  it('Matches the current environment', () => {
    cy.visit(
      '/geo/pub/wms?service=WMS&version=1.3.0&request=GetMap&layers=pub:WHSE_BASEMAPPING.DBM_BC_7H_MIL_BATHYMETRC_POLY&styles=&bbox=273875.663,362346.895,1870571.76,1735670.856&width=512&height=440&crs=EPSG:3005&format=image/png'
    )
    cy.compareSnapshot('wms-test1')
  })
})
