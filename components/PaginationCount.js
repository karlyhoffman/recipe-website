import React from 'react';
import Link from 'next/link';
import '../styles/components/pagination-count.scss';

export default ({ querySize = 1, total = 1, currentPage = 1 }) => {
  const numOfPages = Math.ceil(total / querySize);

  if (numOfPages === 1) return null;

  return (
    <ul className="page-count">
      {[...Array(numOfPages).keys()].map(index => (
        <li key={`page-${index}`}>
          {index + 1 === parseInt(currentPage) ? (
            <span>{currentPage}</span>
          ) : (
            <Link href={{ pathname: '/recipes', query: { page: index + 1 } }}>
              <a>{index + 1}</a>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};
