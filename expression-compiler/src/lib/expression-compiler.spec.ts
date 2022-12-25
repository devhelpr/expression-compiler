import { compileExpression, runExpression } from './expression-compiler';

describe('ExpressionCompiler', () => {
  it('should return true', () => {
    const compiledExpression = compileExpression('2 + 5 == 7');
    expect(compiledExpression).toBeTruthy();

    const result = runExpression(compiledExpression, {});
    expect(result).toBeTruthy();
  });

  it('should return 9', () => {
    const compiledExpression = compileExpression('4 + 5');
    const result = runExpression(compiledExpression, {});
    expect(result).toBe(9);
  });

  it('should return true as result of if condition', () => {
    const compiledExpression = compileExpression(
      'if (20*3 > 20) {return true;} else {return false;}'
    );
    const result = runExpression(compiledExpression, {});
    expect(result).toBe(true);
  });

  it('should return true as result of function call', () => {
    const compiledExpression = compileExpression(
      'function test() {return 42;} test();'
    );
    const result = runExpression(compiledExpression, {});
    expect(result).toBe(42);
  });
});
