import { Compiler } from './compiler/compiler';
import { Parser } from './compiler/parser';

export function CompileExpression(expression: string) {
  const parser = new Parser();

  const ast = parser.parse(expression);
  const compiler = new Compiler();
  return compiler.compile(ast);
}

export function RunExpression(
  compiledExpression: (payload?: any) => any,
  payload: unknown
) {
  return compiledExpression(payload);
}

export default CompileExpression;
