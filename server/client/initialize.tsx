import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { Card, CardActions } from "df/components/card";
import Center from "df/server/client/components/center";
import * as React from "react";

export default class Initialize extends React.Component {
  public render() {
    return (
      <Center>
        <Card header="Configure Dataform project">
          <FormGroup label="Enter a project name">
            <InputGroup />
          </FormGroup>

          <CardActions>
            <Button text="Create project" />
          </CardActions>
        </Card>
      </Center>
    );
  }
}
