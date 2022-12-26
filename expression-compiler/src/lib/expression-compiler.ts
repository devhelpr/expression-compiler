import { Compiler } from './compiler/compiler';
import { Parser } from './compiler/parser';
import { IASTTree } from './interfaces/ast';
import {
  CustomFunctionDeclaration,
  CustomFunctionRegistry,
  ICustomFunctionParameter,
} from './interfaces/custom-functions';

const customFunctions: CustomFunctionRegistry = {};

export function registerCustomFunction(
  functionName: string,
  parameters: ICustomFunctionParameter[],
  customFunction: CustomFunctionDeclaration
) {
  customFunctions[functionName] = {
    functionName,
    customFunction,
    parameters,
  };
}

export function compileExpression(expression: string) {
  const parser = new Parser();

  const ast = parser.parse(expression);
  if (!ast) {
    throw new Error('Invalid expression: parsing failed');
  }
  const compiler = new Compiler();
  compiler.setCustomFunctionRegistry(customFunctions);
  return compiler.compile(ast as unknown as IASTTree);
}

export function runExpression(
  compiledExpression: (payload?: any) => any,
  payload: unknown
) {
  return compiledExpression(payload);
}

export default compileExpression;
