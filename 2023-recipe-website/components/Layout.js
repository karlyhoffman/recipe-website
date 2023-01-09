// import { Meta, Navbar, Footer } from 'components';
import { useEffect } from 'react';
import { applyHighlightColor } from 'utils/highlight-text';
import { Row, Column } from 'components';

function Layout({ children, fontClasses }) {
  useEffect(applyHighlightColor, []);

  return (
    <>
      {/* <Meta /> */}
      {/* <Navbar /> */}
      <main className={fontClasses}>
        <Row noGutter>
          <Column noGutter>{children}</Column>
        </Row>
      </main>
      {/* <Footer /> */}
    </>
  );
}

export default Layout;
