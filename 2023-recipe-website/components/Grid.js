import classNames from 'classnames';
import styles from 'styles/components/grid.module.scss';

const Row = ({ id, children, noGutter = false, className, fullWidth = false }) => {
  return (
    <div
      id={id || null}
      className={classNames(styles.row, className, 'container', {
        [styles.no_gutter]: noGutter,
        [styles.full]: fullWidth,
      })}
    >
      {children}
    </div>
  );
};

const NUM_OF_COLUMNS = 12; // same as $num-of-columns in columns.module.scss

const Column = ({
  children,
  className,
  noGutter = false,
  xs = NUM_OF_COLUMNS,
  xsOffset,
  sm,
  smOffset,
  md,
  mdOffset,
  lg,
  lgOffset,
  xl,
  xlOffset,
}) => (
  <div
    className={classNames(className, styles.column, {
      [styles.no_gutter]: noGutter,
      [styles[`col-xs-${xs}`]]: xs,
      [styles[`col-sm-${sm}`]]: sm,
      [styles[`col-md-${md}`]]: md,
      [styles[`col-lg-${lg}`]]: lg,
      [styles[`col-xl-${xl}`]]: xl,
      [styles[`offset-xs-${xsOffset}`]]: xsOffset,
      [styles[`offset-sm-${smOffset}`]]: smOffset,
      [styles[`offset-md-${mdOffset}`]]: mdOffset,
      [styles[`offset-lg-${lgOffset}`]]: lgOffset,
      [styles[`offset-xl-${xlOffset}`]]: xlOffset,
    })}
  >
    {children}
  </div>
);

export { Row, Column };
