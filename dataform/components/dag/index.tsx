import {
  Alignment,
  Button,
  Menu,
  MenuItem,
  Navbar,
  Popover,
  Switch,
  Tag,
  Tooltip
} from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";
import { dataform } from "@dataform/protos";
import {
  getDependenciesByName,
  getDependentsByName,
  IAction
} from "df/dataform/components/dag/utils";

import { Dag } from "df/components/dag";
import * as styles from "df/dataform/components/dag/index.css";
import * as React from "react";

const ActionMultiSelect = MultiSelect.ofType<IAction>();

const ActionDag = Dag.ofType<IAction>();

interface IProps {
  graph: dataform.ICompiledGraph;
}

interface IState {
  showAssertions?: boolean;
  selectedActionNames?: string[];
}

export class DataformDag extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      showAssertions: false,
      selectedActionNames: []
    };
  }

  public render() {
    const { graph } = this.props;
    const actions = [].concat(
      (graph.tables || []).map(t => ({ ...t, type: "dataset" })),
      (graph.assertions || []).map(a => ({ ...a, type: "assertion" })),
      (graph.operations || []).map(o => ({ ...o, type: "operation" }))
    ) as IAction[];
    const { showAssertions, selectedActionNames } = this.state;
    const selectedActions = actions.filter(action => selectedActionNames.includes(action.name));
    const actionsToList = actions.filter(action => showAssertions || action.type !== "assertion");
    const actionsToRender =
      selectedActions.length === 0
        ? actionsToList
        : this.filterConnectedActions(actionsToList, selectedActions);

    return (
      <div className={styles.dataformDag}>
        <Navbar>
          <Navbar.Group align={Alignment.LEFT}>
            <ActionMultiSelect
              placeholder={"Filter action names..."}
              items={[...actionsToList]}
              resetOnSelect={true}
              selectedItems={selectedActions}
              noResults={<MenuItem disabled={true} text="No results." />}
              itemRenderer={(action, { modifiers, handleClick }) => (
                <MenuItem
                  active={modifiers.active}
                  icon={selectedActions.includes(action) ? "tick" : "blank"}
                  key={action.name}
                  onClick={handleClick}
                  text={action.name}
                  label={action.type}
                  shouldDismissPopover={false}
                />
              )}
              onItemSelect={action =>
                this.setState(state =>
                  state.selectedActionNames.includes(action.name)
                    ? {
                        selectedActionNames: state.selectedActionNames.filter(
                          selectedAction => selectedAction !== action.name
                        )
                      }
                    : { selectedActionNames: state.selectedActionNames.concat([action.name]) }
                )
              }
              itemPredicate={(search, action) => action.name.toLowerCase().includes(search)}
              popoverProps={{ position: "top-left" }}
              tagRenderer={action => action.name}
              tagInputProps={{
                onRemove: (_, index) => {
                  this.setState(state => ({
                    selectedActionNames: state.selectedActionNames.filter((_, i) => i !== index)
                  }));
                },
                rightElement:
                  this.state.selectedActionNames.length > 0 ? (
                    <Button
                      icon="cross"
                      minimal={true}
                      onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
                        this.setState({ selectedActionNames: [] });
                        e.stopPropagation();
                      }}
                    />
                  ) : null,
                className: styles.actionSearchInput
              }}
            />
            <Navbar.Divider />
            <Switch
              checked={showAssertions}
              label="Include assertions"
              onChange={() => this.setState(state => ({ showAssertions: !state.showAssertions }))}
            />
          </Navbar.Group>
        </Navbar>
        <div className={styles.dagContainer}>
          <ActionDag
            nodes={actionsToRender}
            dependenciesFn={node => node.dependencies || []}
            idFn={node => node.name}
            rendererFn={action => (
              <div className={styles.nodeContent}>
                <div>
                  <Tooltip content={action.name}>
                    <span>{action.target ? action.target.name : action.name}</span>
                  </Tooltip>
                </div>
                <div className={styles.nodeContentInfo}>
                  <Tag>{action.type}</Tag>
                  <Popover position={"bottom"}>
                    <Button icon="more" small={true} minimal={true} />
                    <Menu>
                      <MenuItem
                        icon="pivot"
                        text="Highlight dependencies"
                        onClick={() =>
                          this.setState(state => ({
                            selectedActionNames: [action.name]
                          }))
                        }
                      />
                    </Menu>
                  </Popover>
                </div>
              </div>
            )}
            nodeWidth={180}
            nodeHeight={60}
            nodePaddingX={40}
            nodePaddingY={10}
          />
        </div>
      </div>
    );
  }

  private filterConnectedActions = (allActions: IAction[], connectedTo: IAction[]): IAction[] => {
    const dependentsByName = getDependentsByName(allActions);
    const dependenciesByName = getDependenciesByName(allActions);

    const connectedActions: IAction[] = [];
    // Breadth-first-search from the source nodes through dependencies.
    const dependenciesQueue: IAction[] = [...connectedTo];
    while (dependenciesQueue.length > 0) {
      const next = dependenciesQueue.shift();
      if (!connectedActions.includes(next)) {
        connectedActions.push(next);
      }
      (dependenciesByName[next.name] || [])
        .filter(dependency => !connectedActions.includes(dependency))
        .forEach(dependency => dependenciesQueue.push(dependency));
    }
    // Breadth-first-search from the source nodes through dependents.
    const dependentsQueue: IAction[] = [...connectedTo];
    while (dependentsQueue.length > 0) {
      const next = dependentsQueue.shift();
      if (!connectedActions.includes(next)) {
        connectedActions.push(next);
      }
      (dependentsByName[next.name] || [])
        .filter(dependent => !connectedActions.includes(dependent))
        .forEach(dependent => dependentsQueue.push(dependent));
    }
    return connectedActions;
  };
}
