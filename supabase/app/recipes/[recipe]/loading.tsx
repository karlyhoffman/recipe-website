import classNames from 'classnames';
import { Row, Column } from '@/components/Grid';
import recipeStyles from '@/styles/pages/recipe-detail.module.scss';
import styles from '@/styles/pages/recipe-loading.module.scss';

function Bone({ width = '100%', size = 'sm' }: { width?: string; size?: 'sm' | 'lg' | 'xl' }) {
  return (
    <div
      className={classNames(styles.bone, size === 'lg' && styles.bone_lg, size === 'xl' && styles.bone_xl)}
      style={{ '--bone-width': width } as React.CSSProperties}
    />
  );
}

export default function RecipeLoading() {
  return (
    <>
      <div className={classNames(recipeStyles.recipe__hero, styles.hero)} />

      <div className={recipeStyles.recipe__wrapper}>
        <Row className={recipeStyles.recipe__meta}>
          <Column>
            <Bone size="xl" width="55%" />
          </Column>
          <Column md={6} lg={4}>
            <Bone width="110px" />
          </Column>
          <Column md={6} lg={4}>
            <Bone width="130px" />
          </Column>
          <Column md={6} lg={4}>
            <Bone width="100px" />
          </Column>
        </Row>

        <Row className={recipeStyles.recipe__body}>
          <Column md={4} className={recipeStyles.ingredients}>
            <Bone size="lg" width="140px" />
            <Bone width="80%" />
            <Bone width="65%" />
            <Bone width="75%" />
            <Bone width="55%" />
            <Bone width="70%" />
            <Bone width="60%" />
            <Bone width="80%" />
            <Bone width="50%" />
          </Column>

          <Column md={8} className={recipeStyles.instructions}>
            <Bone size="lg" width="160px" />
            <Bone width="95%" />
            <Bone width="88%" />
            <Bone width="70%" />
            <Bone width="92%" />
            <Bone width="85%" />
            <Bone width="60%" />
          </Column>
        </Row>
      </div>
    </>
  );
}
