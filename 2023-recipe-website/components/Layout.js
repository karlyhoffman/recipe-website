import { useEffect } from 'react';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { Analytics } from '@vercel/analytics/react';
import { Row, Column, ConditionalWrapper, Footer, Meta, Navbar } from 'components';
import { applyHighlightColor } from 'utils/highlight-text';
import styles from 'styles/components/layout.module.scss';

function Layout({ children: content, fontClasses }) {
  const { asPath, pathname } = useRouter();
  const isFullWidthLayout = ['/recipes/[recipe]'].includes(pathname);

  useEffect(applyHighlightColor, [asPath]);

  return (
    <div
      className={classNames(fontClasses, styles.layout, {
        [styles['layout--recipe-detail']]: pathname === '/recipes/[recipe]',
      })}
    >
      <Analytics />
      <Meta />
      <Navbar />
      <main>
        <ConditionalWrapper
          condition={!isFullWidthLayout}
          wrapper={(children) => (
            <Row noGutter>
              <Column noGutter>{children}</Column>
            </Row>
          )}
        >
          {content}
        </ConditionalWrapper>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
