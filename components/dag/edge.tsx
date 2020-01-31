import { IPosition } from "df/components/dag";
import * as styles from "df/components/dag/edge.css";
import * as React from "react";

export interface IEdgeProps {
  start: IPosition;
  end: IPosition;
  nodeWidth: number;
  nodeHeight: number;
  nodePaddingY: number;
  nodePaddingX: number;
  highlight?: boolean;
}

const STROKE_SIZE = 4;
const EDGE_OFFSET = STROKE_SIZE / 2;

export class Edge extends React.Component<IEdgeProps> {
  public render() {
    const minOffset = Math.min(this.props.start.offset, this.props.end.offset);
    const layerDelta = this.props.end.layer - this.props.start.layer;
    const offsetDelta = this.props.end.offset - this.props.start.offset;
    const layerWidth = this.props.nodeWidth + this.props.nodePaddingX * 2;
    const offsetHeight = this.props.nodeHeight + this.props.nodePaddingY * 2;
    const width = (layerDelta - 1) * layerWidth + 2 * this.props.nodePaddingX + STROKE_SIZE;
    const height = Math.abs(offsetDelta) * offsetHeight + STROKE_SIZE;
    // Path stuff.
    const pathStart = {
      x: EDGE_OFFSET / 2,
      y: offsetDelta >= 0 ? EDGE_OFFSET : height - EDGE_OFFSET
    };
    const pathEnd = {
      x: width - EDGE_OFFSET,
      y: offsetDelta >= 0 ? height - EDGE_OFFSET : EDGE_OFFSET
    };
    const pathStartAnchor = {
      x: this.props.nodePaddingY * 2 + (layerDelta - 1) * this.props.nodePaddingY,
      y: pathStart.y
    };
    const pathEndAnchor = {
      x: width - pathStartAnchor.x,
      y: pathEnd.y
    };
    // If it's a straight line, don't use SVGs.
    const isStraight = offsetDelta === 0;
    const classNames = [styles.edge];
    if (isStraight) {
      classNames.push(styles.straight);
    }
    if (this.props.highlight) {
      classNames.push(styles.highlight);
    }
    // Get the top and left svg positions.
    const leftPosition =
      (this.props.start.layer + 1) * layerWidth -
      this.props.nodePaddingX * 2 -
      EDGE_OFFSET +
      this.props.nodePaddingX;
    const topPosition =
      minOffset * offsetHeight + this.props.nodeHeight / 2 - EDGE_OFFSET + this.props.nodePaddingY;
    return (
      <div
        className={classNames.join(" ")}
        style={{
          left: `${leftPosition}px`,
          top: `${topPosition}px`,
          width: `${width}px`,
          height: `${height}px`
        }}
      >
        {" "}
        {!isStraight && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            fill="none"
            className={styles.svg}
          >
            <path
              d={`M ${pathStart.x} ${pathStart.y} C ${pathStartAnchor.x} ${pathStartAnchor.y} ${pathEndAnchor.x} ${pathEndAnchor.y} ${pathEnd.x} ${pathEnd.y}`}
              stroke-width={`${STROKE_SIZE}`}
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>
    );
  }
}
