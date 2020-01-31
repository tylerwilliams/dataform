import { Button, FormGroup, InputGroup, IToaster, Spinner, Toaster } from "@blueprintjs/core";
import { dataform } from "@dataform/protos";
import { Card, CardActions } from "df/components/card";
import { Form, FormItem } from "df/components/forms";
import { BigqueryForm } from "df/dataform/components/database/bigquery_form";
import { Flow } from "df/server/client/components/flow";
import { Service } from "df/server/client/service";
import * as React from "react";

interface IState {
  response?: dataform.server.ProjectStateResponse;
}

interface IProps {
  service: Service;
}

export class Overview extends React.Component<IProps, IState> {
  public static readonly toaster: IToaster = Toaster.create();

  constructor(props: IProps) {
    super(props);
    const _ = this.fetch();
  }

  public render() {
    return (
      <Flow>
        <Card header="Dataform project">Dataform version:</Card>
      </Flow>
    );
  }

  private async fetch() {
    this.setState({ response: await this.props.service.projectState({}) });
  }
}
