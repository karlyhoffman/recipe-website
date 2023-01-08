// import { Meta, Navbar, Footer } from 'components';
import { Row, Column } from "components";

function Layout({ children, fontClasses }) {
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
