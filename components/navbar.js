import React from 'react';
import Link from 'next/link';
import componentStyles from '../styles/components/navbar.scss';

const Navbar = () => {
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
            <a>All Recipes</a>
          </Link>
        </li>
        <li>
          <Link href="/groceries">
            <a>Grocery List</a>
          </Link>
        </li>
      </ul>
      <style jsx>{componentStyles}</style>
    </header>
  );
};

export default Navbar;
