import { p } from 'vitest/dist/index-5aad25c1';
import { Compiler } from './compiler/compiler';
import { Parser } from './compiler/parser';
import { IASTTree } from './interfaces/ast';
import {
  CustomFunctionDeclaration,
  CustomFunctionRegistry,
  ICustomFunctionParameter,
} from './interfaces/custom-functions';
import { IASTTree as IASTMarkupTree } from '@devhelpr/markup-compiler';

const customFunctions: CustomFunctionRegistry = {};
const customBlocks: any = {};

/**
 * Registers a custom function that can be used in expressions
 *
 * @param {string}  functionName - a name of a custom function to register
 * @param {ICustomFunctionParameter[]}  parameters - an expression to compile
 */
export function registerCustomFunction(
  functionName: string,
  parameters: ICustomFunctionParameter[],
  customFunction: CustomFunctionDeclaration,
  receivePayloadAsFirstParameter = false
) {
  customFunctions[functionName] = {
    functionName,
    customFunction,
    parameters,
    receivePayloadAsFirstParameter,
  };
}

export function unregisterCustomFunction(functionName: string) {
  if (customFunctions[functionName]) {
    delete customFunctions[functionName];
  }
}

/**
 * Registers a custom block that can be defined in code and called from the outside
 * @param {string}  blockName - a name of a custom block to register
 * @returns {CustomBlockFunction}
 */
export function registerCustomBlock(blockName: string) {
  const blockFunction = () => {
    //
  };
  customBlocks[blockName] = {
    blockFunction,

    // when compiling and block is found... register the block with this custom block
  };
  return blockFunction;
}

export function unregisterCustomBlock(blockName: string) {
  if (customBlocks[blockName]) {
    delete customBlocks[blockName];
  }
}

/**
 * Parses an expression and returns the Abstract Syntax Tree
 *
 * @param {string}  expression - an expression to compile
 * @returns {IASTTree} An Abstract Syntax Tree
 */
export function expressionAST(expression: string, supportsMarkup = false) {
  const parser = new Parser(supportsMarkup);
  parser.setCustomBlockRegistry(customBlocks);
  const ast = parser.parse(expression);
  if (!ast) {
    throw new Error('Invalid expression: parsing failed');
  }
  return ast;
}

/**
 * Compiles an expression and returns a function that takes a payload and returns the result of the expression
 *
 * @param {string}  expression - an expression to compile
 * @returns {(payload?: any) => any} A function that takes a payload and returns the result of the expression
 */
export function compileExpression(
  expression: string,
  supportsMarkup = false,
  markupCompiler?: (markup: IASTMarkupTree) => string
) {
  const compileInfo = compileExpressionAsInfo(
    expression,
    supportsMarkup,
    markupCompiler
  );

  return (
    new Function('payload', `${compileInfo.script}`) as unknown as (
      payload?: any
    ) => any
  ).bind(compileInfo.bindings);
}

export function compileExpressionAsInfo(
  expression: string,
  supportsMarkup = false,
  markupCompiler?: (markup: IASTMarkupTree) => string
) {
  const parser = new Parser(supportsMarkup);
  parser.setCustomBlockRegistry(customBlocks);
  const ast = parser.parse(expression);
  if (!ast) {
    throw new Error('Invalid expression: parsing failed');
  }
  const compiler = new Compiler();
  if (supportsMarkup && markupCompiler) {
    compiler.setupMarkupCompiler(markupCompiler);
  }
  compiler.setCustomBlockRegistry(customBlocks);
  compiler.setCustomFunctionRegistry(customFunctions);
  const compileInfo = compiler.compile(ast as unknown as IASTTree);

  return compileInfo;
}

export interface ICompiledScriptExpression {
  id: string;
  expressionFunction: (payload?: any) => any;
}

/**
 * Compiles an expression and adds the compiled script to the document and returns an object containing the id of the script node and a function that takes a payload and returns the result of the expression
 *
 * @param {string}  expression - an expression to compile
 * @returns {ICompiledScriptExpression} An object containing the id of the script node and a function that takes a payload and returns the result of the expression
 */
export function compileExpressionAsScriptNode(
  expression: string
): ICompiledScriptExpression {
  const parser = new Parser();
  parser.setCustomBlockRegistry(customBlocks);
  const ast = parser.parse(expression);
  if (!ast) {
    throw new Error('Invalid expression: parsing failed');
  }
  const compiler = new Compiler();
  compiler.setCustomBlockRegistry(customBlocks);
  compiler.setCustomFunctionRegistry(customFunctions);
  const compileInfo = compiler.compile(ast as unknown as IASTTree);
  const id = crypto.randomUUID().replace(new RegExp('-', 'g'), '');
  const script = document.createElement('script');
  script.id = id;
  script.type = 'text/javascript';
  script.text = `function helper_${id} (payload) {${compileInfo.script}};
    bind_${id} = (bindings,payload) => {
      window["function_${id}"] = helper_${id}.bind(bindings);
    };
  `;
  document.head.appendChild(script);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as { [key: string]: any })[`bind_${id}`](compileInfo.bindings);

  return {
    id,
    expressionFunction: (window as { [key: string]: any })[
      `function_${id}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as unknown as (payload?: any) => any,
  };
}

/**
 * Deletes a script node containing a compiled expression
 *
 * @param {string}  id - the id of the script node containing the compiled expression
 * @returns {void}
 */
export function deleteExpressionScriptNode(id: string) {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}

export function isPayloadValid(payload: any, payloadProperties?: string[]) {
  // TODO : add support for nested properties
  let result = {
    result: true,
    error: '',
  };
  payloadProperties?.forEach((property) => {
    if (payload[property] === undefined) {
      result = {
        result: false,
        error: `Unknown variable ${property} `,
      };
    }
  });
  return result;
}

/**
 * Runs a compiled expression
 *
 * @param {(payload?: any) => any}  compiledExpression - a compiled expression
 * @param {any}  payload - a payload to pass to the compiled expression
 * @returns {any} The result of the expression
 */
export function runExpression(
  compiledExpression: (payload?: any) => any,
  payload: unknown,
  validatePayload = false,
  payloadProperties?: string[]
) {
  if (validatePayload) {
    const result = isPayloadValid(payload, payloadProperties);
    if (!result.result) {
      throw new Error(result.error);
    }
  }
  return compiledExpression(payload);
}

export default compileExpression;
