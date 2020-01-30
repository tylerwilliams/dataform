import { IRule } from "df/components/forms/validator";

// from: https://emailregex.com/
const EMAIL_VALIDATION_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const EMAIL_VALIDATOR_RULE: IRule<string> = {
  predicate: v => !v || EMAIL_VALIDATION_REGEX.test(v),
  message: "One of the emails is in an invalid format"
};
