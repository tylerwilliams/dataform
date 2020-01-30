import {
  FileInput,
  HTMLInputProps,
  IFileInputProps,
  IInputGroupProps,
  InputGroup,
  ITagInputProps,
  TagInput
} from "@blueprintjs/core";
import * as React from "react";
import { useState } from "react";
import ValidationErrors from "df/components/forms/validation_errors";
import Validator, { IRuleArray } from "df/components/forms/validator";
import * as styles from "df/components/forms/index.css";

export const Form = (props: React.HTMLProps<any>) => <div {...props}>{props.children}</div>;

interface IItemProps {
  name: string | React.ReactElement<any>;
  description?: string | React.ReactElement<any>;
}

export const FormItem = (props: React.PropsWithChildren<IItemProps>) => (
  <div style={{ marginTop: "20px" }}>
    <div>
      <h4 className="bp3-heading">{props.name}</h4>
      <div className="bp3-text-muted" style={{ marginBottom: "10px" }}>
        {props.description}
      </div>
    </div>
    <div>{props.children}</div>
    <div style={{ marginTop: "20px" }} className={styles.formsDivider} />
  </div>
);

interface IInputGroupWithValidationProps {
  validationRules?: IRuleArray<string>;
  alwaysShowValidationErrors?: boolean;
}

export const InputGroupWithValidation = (
  props: IInputGroupWithValidationProps & IInputGroupProps & HTMLInputProps
) => {
  const { validationRules, alwaysShowValidationErrors, ...htmlProps } = props;
  const [touched, setTouched] = useState(false);
  const validator = Validator.create<string>();

  const handleOnChange = (e: React.FormEvent<HTMLElement>) => {
    setTouched(true);
    if (props.onChange) {
      const _ = props.onChange(e);
    }
  };

  const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (props.onBlur) {
      const _ = props.onBlur(e);
    }
  };

  if (htmlProps.required) {
    validator.addRule(v => !!v && v.trim() !== "", `${htmlProps.name || "Field"} is required`);
  }

  if (validationRules && validationRules.length > 0) {
    validationRules.forEach(({ predicate, message }) => {
      validator.addRule(predicate, message);
    });
  }

  return (
    <>
      <InputGroup {...htmlProps} onChange={handleOnChange} onBlur={handleOnBlur} />
      {(touched || alwaysShowValidationErrors) && (
        <ValidationErrors errors={validator.errors(props.value)} />
      )}
    </>
  );
};

interface IFileInputWithValidationProps {
  validationRules?: IRuleArray<string>;
  alwaysShowValidationErrors?: boolean;
}

export const FileInputWithValidation = (
  props: IFileInputWithValidationProps & IFileInputProps & HTMLInputProps
) => {
  const { alwaysShowValidationErrors, validationRules, ...htmlProps } = props;
  const [fileName, setFileName] = useState<string>(null);

  const validator = Validator.create<string>();

  if (htmlProps.required) {
    validator.addRule(v => !!v && v.trim() !== "", `${htmlProps.name || "Field"} is required`);
  }

  if (validationRules && validationRules.length > 0) {
    validationRules.forEach(({ predicate, message }) => {
      validator.addRule(predicate, message);
    });
  }

  const onInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files[0];
    setFileName(file.name);

    if (props.onInputChange) {
      const _ = props.onInputChange(e);
    }
  };

  return (
    <>
      <FileInput
        {...htmlProps}
        text={fileName ? <span>{fileName}</span> : <span>Choose file...</span>}
        hasSelection={!!fileName}
        onInputChange={onInputChange}
      />
      {alwaysShowValidationErrors && !fileName && (
        <ValidationErrors errors={validator.errors(fileName)} />
      )}
    </>
  );
};

interface ITagInputWithValidationProps extends ITagInputProps {
  alwaysShowValidationErrors?: boolean;
  errors?: string[];
}

export const TagInputWithValidation = (props: ITagInputWithValidationProps) => {
  const { alwaysShowValidationErrors, values, errors, ...tagInputProps } = props;
  const [touched, setTouched] = useState(false);

  const onChange = (newValues: string[]) => {
    setTouched(true);

    if (props.onChange) {
      const _ = props.onChange(newValues);
    }
  };

  return (
    <>
      <TagInput {...tagInputProps} onChange={onChange} values={values} />
      {(touched || alwaysShowValidationErrors) && <ValidationErrors errors={errors || []} />}
    </>
  );
};
