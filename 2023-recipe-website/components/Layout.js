// import { Meta, Navbar, Footer } from 'components';

function Layout({ children, fontClasses }) {
  return (
    <>
      {/* <Meta /> */}
      {/* <Navbar /> */}
      <main className={fontClasses}>{children}</main>
      {/* <Footer /> */}
    </>
  );
}

export default Layout;
