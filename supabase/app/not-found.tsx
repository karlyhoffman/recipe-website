import Link from 'next/link';
import { Row, Column } from '@/components/Grid';

export default function NotFound() {
  return (
    <Row>
      <Column>
        <h1 className="h4 outline">Page Not Found</h1>
        <p>We couldn&apos;t find what you were looking for.</p>
        <br />
        <p>
          <Link href="/recipes" className="h5 highlight">
            Browse all recipes
          </Link>
        </p>
      </Column>
    </Row>
  );
}
