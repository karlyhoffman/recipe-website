import React from 'react';
import Link from 'next/link';
import '../styles/components/navbar.scss';

export default () => {
  return (
    <header id="navbar">
      <ul className="container">
        <li>
          <Link href="/">
            <a>Home</a>
          </Link>
        </li>
        <li className="has-sub">
          <Link href="/recipes">
            <a>Recipes</a>
          </Link>
          <ul className="sub-menu">
            <li>
              <span className="label">BY TAG</span>
            </li>
            <li>
              <Link href="/recipes/ingredients">
                <a>Ingredients</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/cuisines">
                <a>Cuisines</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/dish-types">
                <a>Dish Types</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/seasons">
                <a>Seasons</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/weekday">
                <a>Weekday Meals</a>
              </Link>
            </li>
          </ul>
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
