import {
  Button,
  Callout,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  Position
} from "@blueprintjs/core";
import * as protos from "@dataform/protos";
import { FileInputWithValidation, Form, FormItem } from "df/components/forms";
import * as React from "react";

interface IProps {
  config: protos.dataform.IBigQuery;
  onChange: (config: protos.dataform.IBigQuery) => void;
  alwaysShowValidationErrors?: boolean;
}

export class BigqueryForm extends React.Component<IProps> {

  public render() {
    const { alwaysShowValidationErrors, config } = this.props;
    return (
      <Form>
        <FormItem
          name="Default dataset location"
          description={
            <Callout intent={Intent.WARNING}>
              You can only query across datasets in the same region, so you should choose a data
              location that is the same as the location of the datasets that you intend to query.
            </Callout>
          }
        >
          <Popover
            content={
              <Menu>
                {this.renderLocationMenuSection("Multi-region (recommended)", ["US", "EU"])}
                {this.renderLocationMenuSection("Americas", [
                  "northamerica-northeast1",
                  "southamerica-east1",
                  "us-east4",
                  "us-west2"
                ])}
                {this.renderLocationMenuSection("Asia Pacific", [
                  "asia-east1",
                  "asia-east2",
                  "asia-northeast1",
                  "asia-northeast2",
                  "asia-south1",
                  "asia-southeast1",
                  "australia-southeast1"
                ])}
                {this.renderLocationMenuSection("Europe", [
                  "europe-north1",
                  "europe-west2",
                  "europe-west6"
                ])}
              </Menu>
            }
            position={Position.RIGHT}
          >
            <Button rightIcon="caret-right" text={config.location} />
          </Popover>
        </FormItem>

        <FormItem
          name="Service account credentials"
          description={
            <>
              <p>
                Dataform connects to BigQuery using a Google Cloud service account. Please create a
                new service account with the <i>BigQuery Admin</i> role and upload its key (in JSON
                format) here. See{" "}
                <a
                  href="https://docs.dataform.co/how-to-guides/warehouses/bigquery"
                  target="_blank"
                  rel="noopener"
                >
                  these instructions
                </a>{" "}
                if you need help.
              </p>
              Note that we hide your credentials file for security reasons. If you have previously
              added a credentials file, you will not have to upload it again
            </>
          }
        >
          <FileInputWithValidation
            required={true}
            disabled={false}
            fill={true}
            onInputChange={this.readKeyFile}
            alwaysShowValidationErrors={alwaysShowValidationErrors}
            name="Credentials file"
          />
        </FormItem>
      </Form>
    );
  }
  private readKeyFile = (e: React.FormEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    const file = (e.target as HTMLInputElement).files[0];
    const { config, onChange } = this.props;

    reader.onloadend = () => {
      let newConfig = { ...config };
      try {
        const bigQueryCredentials = String(reader.result);
        newConfig.projectId = JSON.parse(bigQueryCredentials).project_id;
        newConfig.credentials = bigQueryCredentials;
      } catch (err) {
        newConfig = config;
        // Toaster.showError(err);
      }
      onChange(newConfig);
    };

    reader.readAsText(file);
  };

  private handleChangeLocation = (location: string) => {
    this.props.onChange({
      ...this.props.config,
      location
    });
  };

  private renderLocationMenuSection(title: string, locations: string[]) {
    return (
      <>
        <MenuDivider title={title} />
        {locations.map(location => (
          <MenuItem
            key={location}
            text={location}
            onClick={() => this.handleChangeLocation(location)}
          />
        ))}
      </>
    );
  }
}
