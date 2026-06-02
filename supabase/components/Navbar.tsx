import Link from 'next/link';
import { headers } from 'next/headers';
import classNames from 'classnames';
import SearchBar from '@/components/SearchBar';
import styles from '@/styles/components/navbar.module.scss';

export default async function Navbar() {
  const headersList = await headers();
  const showImport = headersList.get('x-user-authenticated') === 'true';

  return (
    <header className={classNames(styles.navbar, 'container')}>
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
        {showImport && (
          <>
            <li>
              <Link href="/import">
                <strong>Import</strong>
              </Link>
            </li>
            <li>
              <form method="POST" action="/api/auth/logout">
                <button type="submit">Logout</button>
              </form>
            </li>
          </>
        )}
        <li>
          <SearchBar />
        </li>
      </ul>
    </header>
  );
}
