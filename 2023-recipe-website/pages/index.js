import { Row, Column } from 'components';
import styles from 'styles/pages/homepage.module.scss';

export default function Homepage() {
  return (
    <Row id={styles.homepage}>
      <h1 className="sr-only">Recipe Website</h1>

      <Column className={styles.featured}>
        <h2>Recipes to Cook Next</h2>
        <ul className="h2">
          <li>
            <a className="highlight" href="/recipes/pulled-mushroom-tacos-with-salsa-guille">
              Pulled Mushroom Tacos With Salsa Guille
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/salsa-guille-serrano-pepper-salsa-peanut-butter">
              Salsa Guille
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/creamy-mushroom-and-green-bean-masala">
              Creamy Mushroom and Green Bean Masala
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/couscous-with-dates">
              Couscous with Dates
            </a>
          </li>
        </ul>
      </Column>

      <Column md={6} className={styles.subgroup}>
        <h2>Favorites</h2>
        <ul className="h3">
          <li>
            <a className="highlight" href="/recipes/spicy-adobo-shrimp-cocktail">
              Spicy Adobo Shrimp Cocktail
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/lemon-gnocchi-with-spinach-and-peas">
              Lemon Gnocchi with Spinach and Peas
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/whole-roasted-cauliflower-with-pistachio-pesto">
              Whole Roasted Cauliflower With Pistachio Pesto
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/spaghetti-bolognese">
              Spaghetti Bolognese
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/double-tomato-bruschetta">
              Double Tomato Bruschetta
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/pasta-alla-norma">
              Pasta alla Norma
            </a>
          </li>
        </ul>
      </Column>

      <Column md={6} className={styles.subgroup}>
        <h2>Recently Added</h2>
        <ul className="h3">
          <li>
            <a className="highlight" href="/recipes/spicy-adobo-shrimp-cocktail">
              Spicy Adobo Shrimp Cocktail
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/lemon-gnocchi-with-spinach-and-peas">
              Lemon Gnocchi with Spinach and Peas
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/whole-roasted-cauliflower-with-pistachio-pesto">
              Whole Roasted Cauliflower With Pistachio Pesto
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/spaghetti-bolognese">
              Spaghetti Bolognese
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/double-tomato-bruschetta">
              Double Tomato Bruschetta
            </a>
          </li>
          <li>
            <a className="highlight" href="/recipes/pasta-alla-norma">
              Pasta alla Norma
            </a>
          </li>
        </ul>
      </Column>

      <Column className={styles.subgroup}>
        <h2>Ideas for Next Week</h2>
      </Column>
    </Row>
  );
}
