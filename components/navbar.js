import React from 'react';
import Link from 'next/link';
import '../styles/components/navbar.scss';

export default () => {
  // TODO: hookup to CMS
  return (
    <header id="navbar">
      <ul className="container">
        <li>
          <Link href="/">
            <a>Home</a>
          </Link>
        </li>
        <li>
          <Link href="/recipes">
            <a>Recipes</a>
          </Link>
        </li>
        <li>
          <Link href="/groceries">
            <a>Grocery List</a>
          </Link>
        </li>
      </ul>
    </header>
  );
};
