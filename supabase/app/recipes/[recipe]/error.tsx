'use client';

import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import styles from '@/styles/pages/error.module.scss';

export default function RecipeError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className={styles.wrapper}>
      <Row>
        <Column>
          <h1 className="h4 outline">Something went wrong</h1>
          <p>There was a problem loading this recipe.</p>
          <div className={styles.actions}>
            <button onClick={unstable_retry} className="h6">
              Try again
            </button>
            <Link href="/recipes" className="h6">
              Browse all recipes
            </Link>
          </div>
        </Column>
      </Row>
    </div>
  );
}
