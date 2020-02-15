import React from 'react';
import Link from 'next/link';
import '../styles/components/navbar.scss';

export default () => {
  return (
    <header id="navbar">
      <ul className="nav-menu container my-0">
        <li>
          <Link href="/" as="/">
            <a>Home</a>
          </Link>
        </li>
        <li className="has-sub">
          <Link href="/recipes" as="/recipes">
            <a>Recipes</a>
          </Link>
          <ul className="sub-menu">
            <li>
              <span className="label">BY TAG</span>
            </li>
            <li>
              <Link href="/recipes/ingredients" as="/recipes/ingredients">
                <a>Ingredients</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/cuisines" as="/recipes/cuisines">
                <a>Cuisines</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/dish-types" as="/recipes/dish-types">
                <a>Dish Types</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/seasons" as="/recipes/seasons">
                <a>Seasons</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/weekday" as="/recipes/weekday">
                <a>Weekday Meals</a>
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link href="/groceries" as="/groceries">
            <a>Grocery List</a>
          </Link>
        </li>
      </ul>
    </header>
  );
};
