describe('Layout', () => {
  it('Should be a Box', () => {
    cy.visit('/');

    cy.get('main').should('have.class', 'MuiBox-root');
  });
});
