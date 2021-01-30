import Head from 'next/head';
// import { SEO } from 'components';

const isProduction = process.env.NODE_ENV === 'production';
const googleTagID = process.env.GOOGLE_TAG_ID;
const googleTagManagerID = process.env.GOOGLE_TAG_MANAGER_ID;

function setGoogleTags() {
  return {
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', ${googleTagID});
    `,
  };
}

function setGoogleTagManager() {
  return {
    __html: `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer',${googleTagManagerID});
    `
  };
}

function Meta() {
  return (
    <>
      {/* <SEO /> */}
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>5047 Cooking</title>
        {/* FAVICON */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#cc8b0e"
        />
        <meta name="msapplication-TileColor" content="#00aba9" />
        <meta name="theme-color" content="#ffffff" />
        {/* PRELOAD FONTS */}
        <link
          href="/fonts/Alegreya/Alegreya-Bold.woff"
          rel="preload"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-Bold.woff2"
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-BoldItalic.woff"
          rel="preload"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-BoldItalic.woff2"
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-Italic.woff"
          rel="preload"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-Italic.woff2"
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-Regular.woff"
          rel="preload"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/Alegreya/Alegreya-Regular.woff2"
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/MerriweatherSans/MerriweatherSans-ExtraBold.woff"
          rel="preload"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/MerriweatherSans/MerriweatherSans-ExtraBold.woff2"
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/MerriweatherSans/MerriweatherSans-ExtraBoldItalic.woff"
          rel="preload"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/MerriweatherSans/MerriweatherSans-ExtraBoldItalic.woff2"
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* GOOGLE TAGS */}
        {/* {isProduction && (
          <>
            <script dangerouslySetInnerHTML={setGoogleTagManager()} />
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=${googleTagID}"
            />
            <script dangerouslySetInnerHTML={setGoogleTags()} />
          </>
        )} */}
      </Head>
    </>
  );
}

export default Meta;
