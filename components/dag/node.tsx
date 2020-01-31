import { IPosition } from "df/components/dag";
import * as styles from "df/components/dag/node.css";
import * as React from "react";

export interface INodeProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  position: IPosition;
  hasDependencies?: boolean;
  hasDependents?: boolean;
  nodeWidth: number;
  nodeHeight: number;
  nodePaddingY: number;
  nodePaddingX: number;
  highlight?: boolean;
}

export class Node<T> extends React.Component<INodeProps<T>> {
  public static ofType<T>() {
    return Node as new (props: INodeProps<T>) => Node<T>;
  }

  public render() {
    const classNames = [styles.node, this.props.className || ""];
    if (this.props.hasDependencies) {
      classNames.push(styles.hasDependencies);
    }
    if (this.props.hasDependents) {
      classNames.push(styles.hasDependents);
    }
    if (this.props.highlight) {
      classNames.push(styles.highlight);
    }
    return (
      <div
        {...this.props}
        className={classNames.join(" ")}
        style={{
          left:
            this.props.position.layer * (this.props.nodeWidth + this.props.nodePaddingX * 2) +
            this.props.nodePaddingX +
            "px",
          top:
            this.props.position.offset * (this.props.nodeHeight + this.props.nodePaddingY * 2) +
            this.props.nodePaddingY +
            "px",
          width: this.props.nodeWidth + "px",
          height: this.props.nodeHeight + "px"
        }}
      >
        <div className={styles.content}>{this.props.children}</div>
      </div>
    );
  }
}
