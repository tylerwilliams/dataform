import * as styles from "df/server/client/components/flow.css";
import * as React from "react";

interface IState {
  step: number;
}

interface IProps {
  step?: number;
}

export class Flow extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = { step: props.step };
  }
  public render() {
    const step = this.state.step || this.props.step || 0;
    const children = this.props.children instanceof Array ? this.props.children : [this.props.children];
    return <div className={styles.center}>{children[step]}</div>;
  }
}
