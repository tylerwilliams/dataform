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
          <Form>
            <FormItem name={"Select warehouse type"}>
              <Button text="BigQuery" />
            </FormItem>
          </Form>
          <CardActions>
            <Button
              text="Create project"
              onClick={() => this.setState(state => ({ step: state.step + 1 }))}
            />
          </CardActions>
        </Card>
        <Card header="Configure Dataform project" headerRight={directoryTag}>
          <BigqueryForm
            config={this.state.profile || {}}
            onChange={profile => this.setState({ profile })}
          />

          <CardActions>
            <Button
              text="Create project"
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
          <CardActions>
            <Link to="/">
              <Button text="Project overview" />
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
