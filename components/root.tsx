import * as styles from "df/components/root.css";
import * as React from "react";

export const Root = ({
  className,
  children,
  ...rest
}: React.PropsWithChildren<{}> & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={[styles.root, className].join(" ")}>
    {children}
  </div>
);
