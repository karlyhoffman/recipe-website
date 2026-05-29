import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { Row, Column } from '@/components/Grid';
import styles from '@/styles/components/navbar.module.scss';

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <Row>
        <Column>
          <ul className={styles.navbar__menu}>
            <li>
              <Link href="/">
                <strong>Home</strong>
              </Link>
            </li>
            <li>
              <Link href="/recipes">
                <strong>Recipes</strong>
              </Link>
            </li>
            <li>
              <Link href="/groceries">
                <strong>Grocery List</strong>
              </Link>
            </li>
            <li>
              <SearchBar />
            </li>
          </ul>
        </Column>
      </Row>
    </header>
  );
}
