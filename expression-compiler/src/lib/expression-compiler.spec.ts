import { CompileExpression, RunExpression } from './expression-compiler';

describe('ExpressionCompiler', () => {
  it('should return true', () => {
    const compiledExpression = CompileExpression('2 + 5 == 3');
    expect(compiledExpression).toBeTruthy();

    const result = RunExpression(compiledExpression, {});
    expect(result).toBeTruthy();
  });

  /*it('should return true', () => {
    const result = RunExpression('', {});
    expect(result).toBeTruthy();
  });
  */
});
