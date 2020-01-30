import * as styles from "df/components/card.css";
import * as React from "react";

export interface ICardProps {
  header?: string | React.ReactElement;
  headerRight?: React.ReactNode;
}

export const Card = ({
  header,
  headerRight,
  children,
  className,
  ...rest
}: React.PropsWithChildren<ICardProps> & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={[className, styles.cardContainer].join(" ")}>
    <div className={styles.cardMainContainer}>
      {(header || headerRight) && (
        <span className={styles.cardHeaderContainer}>
          <h3>{header}</h3>
          {headerRight && (
            <span className={styles.cardSecondaryActionsContainer}>{headerRight}</span>
          )}
        </span>
      )}
      <div className={styles.cardContentContainer}>{children}</div>
    </div>
  </div>
);

export const CardActions = ({
  children,
  className,
  ...rest
}: React.PropsWithChildren<{}> & React.HTMLAttributes<HTMLDivElement>) => (
  <>
    <div className={styles.cardActionsSpacer} />
    <div {...rest} className={[styles.cardActions, className].join(" ")}>
      {children}
    </div>
  </>
);

export const CardMedia = ({
  children,
  className,
  ...rest
}: React.PropsWithChildren<{}> & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={[styles.cardMedia, className].join(" ")}>
    {children}
  </div>
);

export interface ICardGridProps {
  width?: number;
}

export const CardGrid = (
  props: ICardGridProps & React.PropsWithChildren<{}> & React.HTMLAttributes<HTMLDivElement>
) => {
  const width = props.width || 3;
  return (
    <div
      className={[styles.grid, props.className].join(" ")}
      style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
    >
      {props.children}
    </div>
  );
};
