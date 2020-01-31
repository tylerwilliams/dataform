import * as styles from "df/server/client/components/center.css";
import * as React from "react";

export default class Center extends React.Component {
  public render() {
    return <div className={styles.center}>{this.props.children}</div>;
  }
}
