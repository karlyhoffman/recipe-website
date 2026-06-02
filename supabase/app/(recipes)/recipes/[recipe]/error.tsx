'use client';

import Link from 'next/link';
import { Row, Column } from '@/components/Grid';

export default function RecipeError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <Row>
      <Column>
        <h1 className="h4 outline">Something went wrong</h1>
        <p>There was a problem loading this recipe.</p>
        <br />
        <button onClick={unstable_retry} className="h6">
          Try again
        </button>
      </Column>
      <Column>
        <Link href="/recipes" className="h6">
          Browse all recipes
        </Link>
      </Column>
    </Row>
  );
}
