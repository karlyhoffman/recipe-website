import { Meta, Navbar } from 'components';

// const isProduction = process.env.NODE_ENV === 'production';

// const setGoogleTagPixel = () => {
//   return {
//     __html: `
//       [GOOGLE SCRIPT HERE]
//     `,
//   };
// };

function Layout({ children }) {
  return (
    <>
      <Meta />
      {/* {isProduction && <span dangerouslySetInnerHTML={setGoogleTagPixel()} />} */}
      {/* <Navbar /> */}
      <main>{children}</main>
    </>
  );
}

export default Layout;
