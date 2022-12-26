import { VariableType } from './variable-type';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomFunctionDeclaration = (...args: any) => any;

export interface ICustomFunction {
  functionName: string;
  parameters: ICustomFunctionParameter[];
  customFunction: CustomFunctionDeclaration;
}

export interface ICustomFunctionParameter {
  parameterName: string;
  parameterType: VariableType;
}

export type CustomFunctionRegistry = { [key: string]: ICustomFunction };
