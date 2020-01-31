import {
  Button,
  FormGroup,
  InputGroup,
  IToaster,
  Navbar,
  NavbarGroup,
  Spinner,
  Tag,
  Toaster
} from "@blueprintjs/core";
import { dataform } from "@dataform/protos";
import { Card, CardActions } from "df/components/card";
import { Form, FormItem } from "df/components/forms";
import { List, ListItem } from "df/components/list";
import { DataformDag } from "df/dataform/components/dag";
import { BigqueryForm } from "df/dataform/components/database/bigquery_form";
import { Flow } from "df/server/client/components/flow";
import * as styles from "df/server/client/overview.css";
import { Service } from "df/server/client/service";
import * as React from "react";

interface IState {
  response?: dataform.server.ICompileResponse;
}

interface IProps {
  service: Service;
  metadata: dataform.server.MetadataResponse;
}

export class Overview extends React.Component<IProps, IState> {
  public static readonly toaster: IToaster = Toaster.create();

  public state: IState = {};

  constructor(props: IProps) {
    super(props);
    const _ = this.fetch();
  }

  public render() {
    return (
      <div className={styles.overviewContainer}>
        <Navbar>
          <NavbarGroup>
            <Button icon="menu" minimal={true} />
            <Navbar.Divider />
            <img src="/public/new_logo_with_text.svg" />
          </NavbarGroup>
          <NavbarGroup align="right">
            <Tag>{this.props.metadata.projectDir}</Tag>
          </NavbarGroup>
        </Navbar>
        {/* <Card header="Dataform project">
          {!this.state.response && <Spinner size={100} />}
          {this.state.response && (
            <List>
              <ListItem left="Directory" right={<code>{this.props.metadata.projectDir}</code>} />
              <ListItem
                left="Dataform version"
                right={<Tag>{this.state.response.graph.dataformCoreVersion}</Tag>}
              />
              <ListItem
                left="Statistics"
                right={
                  <>
                    <Tag>{this.state.response.graph.tables.length} tables</Tag>
                    <Tag>{this.state.response.graph.assertions.length} assertions</Tag>
                    <Tag>{this.state.response.graph.operations.length} operations</Tag>
                  </>
                }
              />
            </List>
          )}
        </Card> */}
        <div className={styles.dagContainer}>
          {this.state.response && <DataformDag graph={this.state.response.graph} />}
        </div>
      </div>
    );
  }

  private async fetch() {
    this.setState({ response: await this.props.service.compile({}) });
  }
}
