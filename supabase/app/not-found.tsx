import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import styles from '@/styles/pages/not-found.module.scss';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <Row>
        <Column>
          <h1 className="h4 outline">Page Not Found</h1>
          <p>We couldn&apos;t find what you were looking for.</p>
          <p>
            <Link href="/recipes" className="h5 highlight">
              Browse all recipes
            </Link>
          </p>
        </Column>
      </Row>
    </div>
  );
}
