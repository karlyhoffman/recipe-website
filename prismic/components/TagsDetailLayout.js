import { PrismicText } from '@prismicio/react';
import { Row, Column, PrismicLink } from 'components';

function TagsDetailLayout({ recipes = [], children: tagName }) {
  const headline = tagName ? `${tagName} Recipes` : 'Recipes by Tag';

  return (
    <Row>
      <Column>
        <h1 className="h4 outline">{headline}</h1>
        {!!recipes.length ? (
          <ul className="recipe-list">
            {recipes.map((recipe) => (
              <li key={recipe?.id}>
                <PrismicLink document={recipe} className="h5 highlight">
                  <PrismicText field={recipe?.data?.title} />
                </PrismicLink>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            <strong>No recipes found.</strong>
          </p>
        )}
      </Column>
    </Row>
  );
}

export default TagsDetailLayout;
