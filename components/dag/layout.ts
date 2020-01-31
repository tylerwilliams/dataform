import { IDagProps } from "df/components/dag";

export interface IPlacingNode<T> {
  id: string;
  node: T;
  dependencies: Array<IPlacingNode<T>>;
  dependents: Array<IPlacingNode<T>>;
  layer: number;
  offset: number;
}

export interface ILayoutIterationParams {
  springExponent: number;
  offsetRange: number;
  zeroSpringRatio: number;
  overlappingLineCost: number;
}

export function layout<T>(props: IDagProps<T>): Array<IPlacingNode<T>> {
  // Parameters that control overall layout iterations.
  const initialNodeVerticalSpacing = 2;
  const mainLoopIterations = 100;
  const mainLoopParams: ILayoutIterationParams = {
    springExponent: 1.5,
    offsetRange: 5,
    zeroSpringRatio: 1,
    overlappingLineCost: 10
  };
  const finalLoopIterations = 1;
  const finalLoopParams: ILayoutIterationParams = {
    ...mainLoopParams,
    zeroSpringRatio: 0.1
  };
  const placedNodes = computeInitialLayout(props, initialNodeVerticalSpacing);
  // This is the main iteration, where nodes are pulled back to 0.
  for (let i = 0; i < mainLoopIterations; i++) {
    iterateLayout(placedNodes, mainLoopParams);
  }
  // Apply a few a iterations where there is no pull to 0.
  for (let i = 0; i < finalLoopIterations; i++) {
    iterateLayout(placedNodes, finalLoopParams);
  }
  finalizeLayout(placedNodes);
  return placedNodes;
}

export function computeInitialLayout<T>(
  props: IDagProps<T>,
  initialNodeVerticalSpacing: number
): Array<IPlacingNode<T>> {
  const { nodes, dependenciesFn, idFn } = props;

  const placedNodesById: { [id: string]: IPlacingNode<T> } = nodes.reduce(
    (acc, node) => ({
      ...acc,
      [idFn(node)]: { id: idFn(node), node, dependencies: [], dependents: [], layer: 0, offset: 0 }
    }),
    {}
  );

  let placedIds: { [id: string]: boolean } = {};

  let nodesToPlace = [...nodes];

  // While the nodes to place list is not empty, assign nodes to the
  // current layer then move to the next layer until all nodes are placed.
  for (let currentLayer = 0; nodesToPlace.length > 0; currentLayer++) {
    if (currentLayer > nodes.length) {
      // The worst graph possible is a linked list of nodes, one in each layer.
      // If we have got to a layer beyond that, it means we still haven't
      // successfully placed all nodes, therefore there must be a loop somewhere.
      throw new Error("Couldn't compute graph due to circular dependencies");
    }
    const nextNodesToPlace: T[] = [];
    const placedIdsThisLayer: { [id: string]: boolean } = {};
    nodesToPlace.forEach(node => {
      // If the dependencies don't exist, just ignore them.
      const nodeDependencies = dependenciesFn(node).filter(
        dependency => placedNodesById[dependency]
      );
      const nodeId = idFn(node);
      if (!nodeDependencies.find(dependency => !placedIds[dependency])) {
        placedIdsThisLayer[nodeId] = true;

        const placedNode = placedNodesById[nodeId];
        // If the node has no dependencies or dependents, place it in a special layer.
        placedNode.layer = currentLayer;
        placedNode.dependencies = nodeDependencies.map(
          nodeDependency => placedNodesById[nodeDependency]
        );
      } else {
        nextNodesToPlace.push(node);
      }
    });
    nodesToPlace = nextNodesToPlace;
    placedIds = { ...placedIds, ...placedIdsThisLayer };
  }

  const placedNodes = Object.values(placedNodesById);

  // Compute dependents.
  placedNodes.forEach(placedNode =>
    placedNode.dependencies.forEach(dependency => dependency.dependents.push(placedNode))
  );

  // Move nodes with no dependents or dependencies to a special layer.
  placedNodes
    .filter(placedNode => placedNode.dependencies.length + placedNode.dependents.length === 0)
    .forEach(placedNode => {
      placedNode.layer = -1;
    });

  // Group by layer.
  let placedNodesByLayer = groupBy(Object.values(placedNodesById), node => node.layer);

  const maxLayer = Object.keys(placedNodesByLayer).reduce(
    (acc, layer) => Math.max(acc, Number(layer)),
    0
  );

  // Push each node with dependents in the graph forwards as far as it can go (fewer longer edges is good).
  Object.keys(placedNodesByLayer)
    .map(layer => Number(layer))
    .sort()
    .reverse()
    // Ignore the first special layer.
    .filter(layer => layer >= 0)
    .forEach(layer =>
      placedNodesByLayer[layer]
        .filter(node => node.dependents.length > 0)
        .forEach(node => {
          node.layer = node.dependents
            .map(dependentNode => dependentNode.layer)
            .reduce((acc, dependentLayer) => Math.min(dependentLayer - 1, acc), maxLayer);
        })
    );

  // We just moved things, so recompute layers.
  placedNodesByLayer = groupBy(Object.values(placedNodesById), node => node.layer);

  // Set initial offsets in the order they came in.
  Object.values(placedNodesByLayer).forEach(layer =>
    layer.forEach((node, i) => {
      // Spread with extra spacing around offset 0. This is quite important.
      node.offset = (i - Math.round(layer.length / 2)) * initialNodeVerticalSpacing;
    })
  );

  return placedNodes;
}

export function iterateLayout<T>(nodes: Array<IPlacingNode<T>>, params: ILayoutIterationParams) {
  const computeCost = (node: IPlacingNode<T>, overrideOffset: number = null) => {
    // We compute the cost as the sum absolute vertical offset differences.
    const offset = overrideOffset == null ? node.offset : overrideOffset;
    const linkedNodes = node.dependents.concat(node.dependencies);
    let totalCost = 0;
    totalCost += linkedNodes.reduce(
      (acc, dep) => acc + Math.pow(Math.abs(offset - dep.offset), params.springExponent),
      Math.abs(offset * params.zeroSpringRatio)
    );
    // Add a significant additional cost for having multiple dependencies on the same line.
    totalCost +=
      Math.max(node.dependencies.filter(dep => dep.offset === offset).length - 1, 0) *
      params.overlappingLineCost;
    // Add another cost for when there is a connection going straight through another node.
    totalCost +=
      node.dependencies.filter(dep => dep.offset === offset && node.layer - dep.layer > 1).length *
      params.overlappingLineCost;
    return totalCost;
  };
  const computeSwapCostDelta = (nodeA: IPlacingNode<T>, nodeB: IPlacingNode<T>) => {
    // The cost change from swapping two nodes offsets.
    return (
      computeCost(nodeA, nodeB.offset) +
      computeCost(nodeB, nodeA.offset) -
      (computeCost(nodeA) + computeCost(nodeB))
    );
  };
  const nodesByLayer = groupBy(nodes, node => node.layer);
  // A single iteration moves each node at most once.
  nodes.forEach(node => {
    const nodesInLayer = nodesByLayer[node.layer];
    const nodesInLayerByOffset = groupBy(nodesInLayer, nodeInLayer => nodeInLayer.offset);
    // Loop through adjacent offsets, looking for a swap or move that reduces cost.
    const currentCost = computeCost(node);
    let bestOffset = node.offset;
    let bestCostDelta = 0;
    for (
      let offset = node.offset - params.offsetRange;
      offset <= node.offset + params.offsetRange;
      offset++
    ) {
      if (offset === node.offset) {
        // No need to compare against our current position.
        continue;
      }
      if (!!nodesInLayerByOffset[offset]) {
        // There is a node in this position, so evaluate the cost of a swap.
        const otherNode = nodesInLayerByOffset[offset][0];
        const swapCostDelta = computeSwapCostDelta(node, otherNode);
        if (swapCostDelta <= bestCostDelta) {
          bestOffset = offset;
          bestCostDelta = swapCostDelta;
        }
      } else {
        // There's no node in the new position, so just compare the cost of a move.
        const moveCostDelta = computeCost(node, offset) - currentCost;
        if (moveCostDelta <= bestCostDelta) {
          bestOffset = offset;
          bestCostDelta = moveCostDelta;
        }
      }
    }
    if (bestOffset !== node.offset) {
      // There is a cost saving move/swap, apply the change.
      if (!!nodesInLayerByOffset[bestOffset]) {
        nodesInLayerByOffset[bestOffset][0].offset = node.offset;
      }
      node.offset = bestOffset;
    }
  });
}

export function finalizeLayout<T>(nodes: Array<IPlacingNode<T>>) {
  // Compute the minimum offset for normal layers.
  const minOffset = nodes
    .filter(node => node.layer >= 0)
    .reduce((acc, node) => Math.min(acc, node.offset), Number.MAX_SAFE_INTEGER);
  // Compute the minimum offset for the special layer.
  const minSpecialOffset = nodes
    .filter(node => node.layer === 0)
    .reduce((acc, node) => Math.min(acc, node.offset), Number.MAX_SAFE_INTEGER);
  // Compute the minimum layer.
  const minLayer = nodes.reduce((acc, node) => Math.min(acc, node.layer), Number.MAX_SAFE_INTEGER);
  // Fix layers to start at 0, and fix offsets to start at 0 seperately across normal and special layers.
  nodes.forEach(node => {
    if (node.layer >= 0) {
      node.offset -= minOffset;
    } else {
      node.offset -= minSpecialOffset;
    }
    node.layer -= minLayer;
  });
}

export function groupBy<T>(values: T[], keyFn: (value: T) => number | string) {
  return values.reduce(
    (acc, value) => {
      const key = keyFn(value);
      acc[key] = acc[key] || [];
      acc[key].push(value);
      return acc;
    },
    {} as { [key: string]: T[] }
  );
}
