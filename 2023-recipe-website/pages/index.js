import classNames from 'classnames';
import { Row, Column } from 'components';
import styles from 'styles/pages/homepage.module.scss';

export default function Homepage() {
  return (
    <Row id={styles.homepage}>
      <h1 className="sr-only">Recipe Website</h1>

      <Column className={classNames(styles.group, styles.group__featured)}>
        <h2 className="h4 outline">Recipes to Cook Next</h2>
        <ul>
          <li>
            <a className="h4 highlight" href="/recipes/pulled-mushroom-tacos-with-salsa-guille">
              Pulled Mushroom Tacos With Salsa Guille
            </a>
          </li>
          <li>
            <a className="h4 highlight" href="/recipes/salsa-guille-serrano-pepper-salsa-peanut-butter">
              Salsa Guille
            </a>
          </li>
          <li>
            <a className="h4 highlight" href="/recipes/creamy-mushroom-and-green-bean-masala">
              Creamy Mushroom and Green Bean Masala
            </a>
          </li>
          <li>
            <a className="h4 highlight" href="/recipes/couscous-with-dates">
              Couscous with Dates
            </a>
          </li>
        </ul>
      </Column>

      <Column md={6} className={classNames(styles.group, styles.group__subgroup)}>
        <div className={styles.group__wrapper}>
          <h2 className="h4 outline">Favorites</h2>
          <ul>
            <li>
              <a className="h5 highlight" href="/recipes/spicy-adobo-shrimp-cocktail">
                Spicy Adobo Shrimp Cocktail
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/lemon-gnocchi-with-spinach-and-peas">
                Lemon Gnocchi with Spinach and Peas
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/whole-roasted-cauliflower-with-pistachio-pesto">
                Whole Roasted Cauliflower With Pistachio Pesto
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/spaghetti-bolognese">
                Spaghetti Bolognese
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/double-tomato-bruschetta">
                Double Tomato Bruschetta
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/pasta-alla-norma">
                Pasta alla Norma
              </a>
            </li>
          </ul>
        </div>
      </Column>

      <Column md={6} className={classNames(styles.group, styles.group__subgroup)}>
        <div className={styles.group__wrapper}>
          <h2 className="h4 outline">Recently Added</h2>
          <ul>
            <li>
              <a className="h5 highlight" href="/recipes/spicy-adobo-shrimp-cocktail">
                Spicy Adobo Shrimp Cocktail
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/lemon-gnocchi-with-spinach-and-peas">
                Lemon Gnocchi with Spinach and Peas
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/whole-roasted-cauliflower-with-pistachio-pesto">
                Whole Roasted Cauliflower With Pistachio Pesto
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/spaghetti-bolognese">
                Spaghetti Bolognese
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/double-tomato-bruschetta">
                Double Tomato Bruschetta
              </a>
            </li>
            <li>
              <a className="h5 highlight" href="/recipes/pasta-alla-norma">
                Pasta alla Norma
              </a>
            </li>
          </ul>
        </div>
      </Column>

      <Column md={9} className={classNames(styles.group, styles.group__subgroup)}>
        <h2 className="h4 outline">Ideas for Next Week</h2>
        <ul>
          <li>
            <a className="h6 highlight" href="/recipes/spicy-adobo-shrimp-cocktail">
              Spicy Adobo Shrimp Cocktail
            </a>
          </li>
          <li>
            <a className="h6 highlight" href="/recipes/lemon-gnocchi-with-spinach-and-peas">
              Lemon Gnocchi with Spinach and Peas
            </a>
          </li>
          <li>
            <a className="h6 highlight" href="/recipes/whole-roasted-cauliflower-with-pistachio-pesto">
              Whole Roasted Cauliflower With Pistachio Pesto
            </a>
          </li>
          <li>
            <a className="h6 highlight" href="/recipes/spaghetti-bolognese">
              Spaghetti Bolognese
            </a>
          </li>
          <li>
            <a className="h6 highlight" href="/recipes/double-tomato-bruschetta">
              Double Tomato Bruschetta
            </a>
          </li>
          <li>
            <a className="h6 highlight" href="/recipes/pasta-alla-norma">
              Pasta alla Norma
            </a>
          </li>
        </ul>
      </Column>
    </Row>
  );
}
