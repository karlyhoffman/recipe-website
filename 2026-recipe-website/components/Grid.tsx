import classNames from 'classnames';
import styles from '@/styles/components/grid.module.scss';

const NUM_OF_COLUMNS = 12;

interface RowProps {
  id?: string;
  children: React.ReactNode;
  noGutter?: boolean;
  className?: string;
}

export function Row({ id, children, noGutter = false, className }: RowProps) {
  return (
    <div
      id={id}
      className={classNames(styles.row, className, 'container', {
        [styles.no_gutter]: noGutter,
      })}
    >
      {children}
    </div>
  );
}

interface ColumnProps {
  children: React.ReactNode;
  className?: string;
  noGutter?: boolean;
  xs?: number;
  xsOffset?: number;
  sm?: number;
  smOffset?: number;
  md?: number;
  mdOffset?: number;
  lg?: number;
  lgOffset?: number;
  xl?: number;
  xlOffset?: number;
}

export function Column({
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
}: ColumnProps) {
  return (
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
}
