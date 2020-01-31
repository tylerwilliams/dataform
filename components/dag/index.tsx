import { Edge, IEdgeProps } from "df/components/dag/edge";
import * as styles from "df/components/dag/index.css";
import { layout } from "df/components/dag/layout";
import { Node } from "df/components/dag/node";
import * as React from "react";

// This library has bad typings.
import Memoize from "fast-memoize";
const memoize = require("fast-memoize") as (typeof Memoize);

export { Edge, Node };

export interface IPosition {
  // Layer currently means the column, nodes with no deps start at layer 0.
  layer: number;
  // Offset is the positioning within the layer, currently the row.
  offset: number;
}

export interface IDagProps<T> {
  nodes: T[];
  dependenciesFn: (node: T) => string[];
  idFn: (node: T) => string;
  rendererFn: (node: T) => React.ReactElement<any>;
  nodeWidth: number;
  nodeHeight: number;
  nodePaddingY: number;
  nodePaddingX: number;
}

interface IState {
  selectedId?: string;
}

export class Dag<T> extends React.Component<IDagProps<T>, IState> {
  public static ofType<T>() {
    return Dag as new (props: IDagProps<T>) => Dag<T>;
  }

  public layout = memoize((props: IDagProps<T>) => layout(props));

  constructor(props: IDagProps<T>) {
    super(props);
    this.state = {};
  }

  public render() {
    const placedNodes = this.layout(this.props);
    const maxOffset = placedNodes.reduce((acc, placedNode) => Math.max(acc, placedNode.offset), 0);
    const maxLayer = placedNodes.reduce((acc, placedNode) => Math.max(acc, placedNode.layer), 0);
    const TypedNode = Node.ofType<T>();
    const edgeProps: IEdgeProps[] = placedNodes.reduce(
      (acc, placedNode) =>
        acc.concat(
          placedNode.dependencies.map(dependency => ({
            start: {
              layer: dependency.layer,
              offset: dependency.offset
            },
            end: {
              layer: placedNode.layer,
              offset: placedNode.offset
            },
            nodeWidth: this.props.nodeWidth,
            nodeHeight: this.props.nodeHeight,
            nodePaddingX: this.props.nodePaddingX,
            nodePaddingY: this.props.nodePaddingY,
            highlight:
              dependency.id === this.state.selectedId || placedNode.id === this.state.selectedId
          }))
        ),
      [] as IEdgeProps[]
    );
    return (
      <div
        style={{
          width: (this.props.nodeWidth + this.props.nodePaddingX * 2) * (maxLayer + 1),
          height: (this.props.nodeHeight + this.props.nodePaddingY * 2) * (maxOffset + 1)
        }}
        onClick={() => this.setState({ selectedId: null })}
      >
        <div className={styles.relativeContainer}>
          {edgeProps.map(props => (
            <Edge {...props} />
          ))}
          {placedNodes.map(placedNode => (
            <TypedNode
              position={placedNode}
              hasDependencies={placedNode.dependencies.length > 0}
              hasDependents={placedNode.dependents.length > 0}
              nodeWidth={this.props.nodeWidth}
              nodeHeight={this.props.nodeHeight}
              nodePaddingX={this.props.nodePaddingX}
              nodePaddingY={this.props.nodePaddingY}
              onClick={e => {
                this.setState({ selectedId: placedNode.id });
                e.stopPropagation();
              }}
              highlight={this.state.selectedId === placedNode.id}
            >
              {this.props.rendererFn(placedNode.node)}
            </TypedNode>
          ))}
        </div>
      </div>
    );
  }
}
