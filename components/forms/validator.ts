export type IRuleArray<T> = Array<IRule<T>>;

export interface IRule<T> {
  predicate: (val: T) => boolean;
  message: string;
}

export default class Validator<T> {
  public static create<T>() {
    return new Validator<T>();
  }
  private rules: Array<IRule<T>> = [];

  public addRule(predicate: (val: T) => boolean, message: string): Validator<T> {
    this.rules.push({
      predicate,
      message
    });
    return this;
  }

  public addRuleObject(rule: IRule<T>): Validator<T> {
    this.rules.push(rule);
    return this;
  }

  public test(val: T): boolean {
    return this.errors(val).length === 0;
  }

  public errors(val: T): string[] {
    return this.rules.filter(rule => !rule.predicate(val)).map(rule => rule.message);
  }

  public copy() {
    const newValidator = new Validator<T>();
    this.rules.forEach(rule => newValidator.rules.push(rule));
    return newValidator;
  }
}
