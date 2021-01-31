import Link from 'next/link';
import classNames from 'classnames';
// import SearchBar from './SearchBar';
// import { MobileDetect } from '../utils/MobileDetect';
import styles from 'styles/components/navbar.module.scss';

function Navbar() {
  // const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  // const isMobile = MobileDetect();

  return (
    <header id={styles.navbar}>
      <div className={classNames(styles.container, 'container')}>
        <ul className={classNames(styles.nav_menu, 'my-0')}>
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
          {/* <li className={styles.has_sub}>
            <Link href="/recipes">
              <a>Recipes</a>
            </Link>
            <ul className={styles.sub_menu}>
              <li>
                <span className={styles.label}>BY TAG</span>
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
          <li className={styles.groceries}>
            <Link href="/groceries">
              <a>Grocery List</a>
            </Link>
          </li> */}
          {/* {!isMobile && (
            <li>
              <SearchBar />
            </li>
          )} */}
        </ul>
        {/* {isPWA && window.location.pathname !== '/' && (
          <button onClick={() => window.history.back()} type="button">
            Back
          </button>
        )} */}
      </div>
    </header>
  );
};

export default Navbar;
