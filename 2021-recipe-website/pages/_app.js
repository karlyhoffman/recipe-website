import { Layout } from 'components';
import 'styles/vendor/bootstrap.scss';
import 'styles/global.scss';

function RecipeApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default RecipeApp;
