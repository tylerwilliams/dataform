import { Callout, Intent } from "@blueprintjs/core";
import * as React from "react";

interface Props {
  errors: string[];
}

export default class ValidationErrors extends React.Component<Props, {}> {
  public render() {
    return (
      <div>
        {this.props.errors.map(error => (
          <Callout
            key={error}
            intent={Intent.PRIMARY}
            style={{ width: "100%", marginBottom: "10px", marginTop: "10px" }}
          >
            <span style={{ marginLeft: "10px" }}>{error}</span>
          </Callout>
        ))}
      </div>
    );
  }
}
