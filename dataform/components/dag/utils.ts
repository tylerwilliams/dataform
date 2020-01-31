import * as protos from "@dataform/protos";

const types = ["dataset", "assertion", "operation", "declaration"] as const;
export type Type = typeof types[number];

export interface IAction {
  name: string;
  type: Type;
  fileName: string;
  dependencies?: string[];
  target?: protos.dataform.ITarget;
}

export const convertGraphToActions = (graph: protos.dataform.ICompiledGraph) => {
  return [].concat(
    (graph.tables || []).map(t => ({ ...t, type: "dataset" })),
    (graph.operations || []).map(o => ({ ...o, type: "operation" })),
    (graph.assertions || []).map(o => ({ ...o, type: "assertion" })),
    (graph.declarations || []).map(o => ({ ...o, type: "declaration" }))
  ) as IAction[];
};

// returns the dependents of the action array passed in
export const getDependentsByName = (allActions: IAction[]): { [name: string]: IAction[] } => {
  const actionsByName = allActions.reduce(
    (acc, action) => ({ ...acc, [action.name]: action }),
    {} as { [name: string]: IAction }
  );

  return allActions.reduce(
    (acc, action) => {
      if (!action.dependencies) {
        return acc;
      }
      action.dependencies
        .map(dependencyName => actionsByName[dependencyName])
        // If the dependency is missing, ignore it.
        .filter(dependency => !!dependency)
        .forEach(dependency => {
          acc[dependency.name] = acc[dependency.name] || [];
          acc[dependency.name].push(action);
        });
      return acc;
    },
    {} as { [name: string]: IAction[] }
  );
};

// returns the dependencies of the action array passed in
export const getDependenciesByName = (allActions: IAction[]): { [name: string]: IAction[] } => {
  const actionsByName = allActions.reduce(
    (acc, action) => ({ ...acc, [action.name]: action }),
    {} as { [name: string]: IAction }
  );

  return allActions.reduce(
    (acc, action) => {
      acc[action.name] = acc[action.name] || [];
      if (!action.dependencies) {
        return acc;
      }
      action.dependencies
        .map(dependencyName => actionsByName[dependencyName])
        .filter(dependency => !!dependency)
        .forEach(dependency => acc[action.name].push(dependency));
      return acc;
    },
    {} as { [name: string]: IAction[] }
  );
};
