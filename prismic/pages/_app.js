import Link from 'next/link';
import { PrismicProvider } from '@prismicio/react';
import { PrismicPreview } from '@prismicio/next';
import { repositoryName } from 'prismicio';
import { Alegreya, Merriweather_Sans } from '@next/font/google';
import { Layout } from 'components';
import 'styles/main.scss';

const alegreya = Alegreya({
  // https://fonts.google.com/specimen/Alegreya
  subsets: ['latin'],
  variable: '--font-alegreya',
});

const merriweather = Merriweather_Sans({
  // https://fonts.google.com/specimen/Merriweather+Sans
  subsets: ['latin'],
  variable: '--font-merriweather',
});

const fonts = `${alegreya.variable} ${merriweather.variable}`;

export default function App({ Component, pageProps }) {
  return (
    <PrismicProvider internalLinkComponent={(props) => <Link {...props} />}>
      <PrismicPreview repositoryName={repositoryName}>
        <Layout fontClasses={fonts}>
          <Component {...pageProps} />
        </Layout>
      </PrismicPreview>
    </PrismicProvider>
  );
}
