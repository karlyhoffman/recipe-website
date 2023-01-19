import { useEffect } from 'react';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { Row, Column, Footer, Meta, Navbar } from 'components';
import { applyHighlightColor } from 'utils/highlight-text';
import styles from 'styles/components/layout.module.scss';

function Layout({ children, fontClasses }) {
  const { asPath } = useRouter();

  useEffect(applyHighlightColor, [asPath]);

  return (
    <div className={classNames(fontClasses, styles.layout)}>
      <Meta />
      <Navbar />
      <main>
        <Row noGutter>
          <Column noGutter>{children}</Column>
        </Row>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
