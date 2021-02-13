import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from 'styles/components/pagination-menu.module.scss';

function PaginationMenu({ totalCount, pageSize, page }) {
  const { pathname } = useRouter();
  const numOfPages = totalCount && pageSize ? Math.ceil(totalCount / pageSize) : 0;

  if (numOfPages < 2) return null;

  return (
    <ul className={styles.pagination_menu}>
      {[...Array(numOfPages).keys()].map((index) => (
        <li key={`page-${index}`}>
          {index + 1 === parseInt(page) ? (
            <span>{page}</span>
          ) : (
            <Link
              href={{
                pathname,
                query: { page: index + 1 },
              }}
            >
              <a>{index + 1}</a>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export default PaginationMenu;
