import { Button, ButtonGroup } from "@blueprintjs/core";
import * as React from "react";

import ValidationErrors from "df/components/forms/validation_errors";
import Validator from "df/components/forms/validator";

interface IProps<T> {
  options: Array<{ value: T; name?: string | React.ReactElement<any> }>;
  onChange: (value: T) => any;
  selectedValue: T;
  alwaysShowValidationErrors?: boolean;
  required?: boolean;
  name?: string;
}

export class ButtonSelectWithValidation<T> extends React.Component<IProps<T>> {
  public static ofType<T>() {
    return ButtonSelectWithValidation as new (props: IProps<T>) => ButtonSelectWithValidation<T>;
  }

  public handleOnClick = (value: T) => {
    const { onChange, selectedValue } = this.props;
    if (value !== selectedValue) {
      onChange(value);
    }
  };

  public render() {
    const { selectedValue, options, alwaysShowValidationErrors } = this.props;
    const validator = Validator.create<T>();

    if (this.props.required) {
      validator.addRule(v => !!v, `${this.props.name || "Field"} is required`);
    }

    return (
      <>
        <ButtonGroup>
          {options.map(option => (
            <Button
              key={String(option.value)}
              active={option.value === selectedValue}
              text={option.name || option.value}
              onClick={() => this.handleOnClick(option.value)}
            />
          ))}
        </ButtonGroup>
        {alwaysShowValidationErrors && (
          <ValidationErrors errors={validator.errors(selectedValue)} />
        )}
      </>
    );
  }
}
