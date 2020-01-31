import { Button, FormGroup, InputGroup, IToaster, Spinner, Tag, Toaster } from "@blueprintjs/core";
import { dataform } from "@dataform/protos";
import { Card, CardActions } from "df/components/card";
import { Form, FormItem } from "df/components/forms";
import { BigqueryForm } from "df/dataform/components/database/bigquery_form";
import { Flow } from "df/server/client/components/flow";
import { Service } from "df/server/client/service";
import * as React from "react";
import { Link } from "react-router-dom";

interface IState {
  warehouse?: "bigquery" | "redshift" | "snowflake" | "postgres";
  profile?: dataform.IBigQuery;
  step?: number;
}

interface IProps {
  service: Service;
  metadata: dataform.server.MetadataResponse;
}

export default class Initialize extends React.Component<IProps, IState> {
  public static readonly toaster: IToaster = Toaster.create();

  public state: IState = {
    step: 0
  };

  public render() {
    const { step } = this.state;
    const directoryTag = (
      <Tag>
        <code>{this.props.metadata.projectDir}</code>
      </Tag>
    );
    return (
      <Flow step={step}>
        <Card header="Initialize Dataform project" headerRight={directoryTag}>
          <h4>Select warehouse type</h4>
          <CardActions>
            <Button
              text={<img src="/public/bigquery-logo.png" style={{ height: "80px" }} />}
              minimal={true}
              active={this.state.warehouse === "bigquery"}
              onClick={() => this.setState({ warehouse: "bigquery" })}
            />

            <Button
              text={<img src="/public/redshift-logo.png" style={{ height: "80px" }} />}
              minimal={true}
              active={this.state.warehouse === "redshift"}
              onClick={() => this.setState({ warehouse: "redshift" })}
            />

            <Button
              text={<img src="/public/snowflake-logo.png" style={{ height: "80px" }} />}
              minimal={true}
              active={this.state.warehouse === "snowflake"}
              onClick={() => this.setState({ warehouse: "snowflake" })}
            />

            <Button
              text={<img src="/public/postgres-logo.png" style={{ height: "80px" }} />}
              minimal={true}
              active={this.state.warehouse === "postgres"}
              onClick={() => this.setState({ warehouse: "postgres" })}
            />
          </CardActions>
          <CardActions align="right">
            <Button
              disabled={!this.state.warehouse}
              text="Configure project"
              intent="primary"
              rightIcon="caret-right"
              onClick={() => this.setState(state => ({ step: state.step + 1 }))}
            />
          </CardActions>
        </Card>
        <Card header="Configure Dataform project" headerRight={directoryTag}>
          <BigqueryForm
            config={this.state.profile || {}}
            onChange={profile => this.setState({ profile })}
          />

          <CardActions align="right">
            <Button
              text="Create project"
              intent="primary"
              rightIcon="caret-right"
              onClick={async () => {
                this.setState(state => ({ step: state.step + 1 }));
                await this.createProject();
              }}
            />
          </CardActions>
        </Card>
        <Card header="Initializing Dataform project" headerRight={directoryTag}>
          <Spinner size={100} />
        </Card>
        <Card header="Dataform project created">
          <p>Your Dataform project has been created in the following directory:</p>
          <code>{this.props.metadata.projectDir}</code>
          <p>
            For next steps, check out the{" "}
            <a href="http://docs.dataform.co">Dataform documentation</a> for help with publishing
            your first data sets.
          </p>
          <CardActions align="right">
            <Link to="/">
              <Button text="Open project overview" intent="primary" />
            </Link>
          </CardActions>
        </Card>
      </Flow>
    );
  }

  private createProject = async () => {
    try {
      await this.props.service.initialize({
        projectConfig: {
          warehouse: "bigquery"
        },
        bigquery: this.state.profile
      });
      this.setState(state => ({ step: state.step + 1 }));
    } catch (e) {
      Initialize.toaster.show({
        message: `Failed to initialize project: ${e}`,
        intent: "danger"
      });
      this.setState(state => ({ step: state.step - 1 }));
    }
  };
}
