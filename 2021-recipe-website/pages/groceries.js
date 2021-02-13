import { useState } from 'react';
import classNames from 'classnames';
import { fetchSingleDocumentByType, fetchMultipleDocumentsByID } from 'api/prismic-queries';
import { GroceryList } from 'components';
import styles from 'styles/pages/groceries.module.scss';

function Groceries({ ingredients }) {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEditMode = () => setIsEditing((prevState) => !prevState);

  return (
    <div id={styles.groceries} className="container">
      <div className="row">
        <div className={classNames(styles.col_title, 'col-12 d-flex')}>
          <h1>Grocery List</h1>
          <button
            className={classNames(styles.edit_btn, { [styles.editing]: isEditing })}
            onClick={toggleEditMode}
            type="button"
          >
            {!isEditing ? 'Edit' : 'Done'}
          </button>
        </div>
        <div className="col-12">
          {/* TODO:
                - Ability to select multiple recipes
                - Once a recipe is selected, add ingredients to list
                - Add "edit" button: ability to rearrange order (https://github.com/atlassian/react-beautiful-dnd)
            */}
          {ingredients && (
            <GroceryList ingredients={ingredients} isEditing={isEditing} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Groceries;

export const getStaticProps = async ({ preview = false, previewData = {} }) => {
  const { ref } = previewData;
  const { data } = await fetchSingleDocumentByType({ type: 'cook_next_list' });

  if (data?.next_recipes) {
    const recipeIDs = data.next_recipes.map((x) => x?.next_recipe?.id);

    const { results = [] } = await fetchMultipleDocumentsByID({
      ids: recipeIDs,
      options: { ref },
    });

    const ingredients = results
      .map((recipe) => recipe?.data?.ingredient_slices)
      .flat()
      .filter((recipe) => recipe?.slice_type === 'ingredient')
      .map((ingredient) => ingredient?.primary?.ingredient);

    return {
      props: {
        ingredients,
        preview,
      },
      revalidate: 1,
    };
  }

  return {
    props: {
      ingredients: [],
      preview
    },
    revalidate: 1,
  };
};
