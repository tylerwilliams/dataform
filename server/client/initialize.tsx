import { Button, FormGroup, InputGroup, IToaster, Spinner, Toaster } from "@blueprintjs/core";
import { dataform } from "@dataform/protos";
import { Card, CardActions } from "df/components/card";
import { Form, FormItem } from "df/components/forms";
import { BigqueryForm } from "df/dataform/components/database/bigquery_form";
import { Flow } from "df/server/client/components/flow";
import { Service } from "df/server/client/service";
import * as React from "react";

interface IState {
  profile?: dataform.IBigQuery;
  step?: number;
}

interface IProps {
  service: Service;
}

export default class Initialize extends React.Component<IProps, IState> {
  public static readonly toaster: IToaster = Toaster.create();

  public state: IState = {
    step: 0
  };

  public render() {
    const { step } = this.state;
    return (
      <Flow step={step}>
        <Card header="Initialize Dataform project">
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
        <Card header="Configure Dataform project">
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
            />
          </CardActions>
        </Card>
        <Card header="Initializing Dataform project">
          <Spinner size={100} />
        </Card>
        <Card header="Dataform project created">
          <p>
            For next steps, check out the{" "}
            <a href="http://docs.dataform.co">Dataform documentation</a> for help with publishing
            your first data sets.
          </p>
          <CardActions>
            <Button
              text="Close"
              onClick={async () => {
                await this.props.service.shutdown({});
              }}
            />
          </CardActions>
        </Card>
      </Flow>
    );
  }

  private createProject = async () => {
    try {
      await this.props.service.initialize({});
      await this.props.service.initializeCredentials({
        bigquery: this.state.profile
      });
    } catch (e) {
      Initialize.toaster.show({
        message: `Failed to initialize project: ${e}`,
        intent: "danger"
      });
    }
    this.setState(state => ({ step: state.step + 1 }));
  };
}
