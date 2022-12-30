import {
  compileExpression,
  registerCustomFunction,
  runExpression,
} from './expression-compiler';

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

  it('should custom function be called', () => {
    const mock = vi.fn();
    registerCustomFunction('customFunction', [], () => {
      mock();
    });

    const compiledExpression = compileExpression('customFunction();');
    runExpression(compiledExpression, {});
    expect(mock).toBeCalled();
  });

  it('should custom function be called with parameters', () => {
    const mock = vi.fn();
    registerCustomFunction('customFunction', [], (a: number, b: number) => {
      mock(a, b);
    });

    const compiledExpression = compileExpression('customFunction(1, 2);');
    runExpression(compiledExpression, {});
    expect(mock).toBeCalledWith(1, 2);
  });

  it('should return a string', () => {
    const compiledExpression = compileExpression('"Hello World"');
    const result = runExpression(compiledExpression, {});
    expect(result).toBe('Hello World');
  });

  it('should return a string with a variable', () => {
    const compiledExpression = compileExpression('"Hello " + name');
    const result = runExpression(compiledExpression, { name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('should return a string with a range', () => {
    const mock = vi.fn();
    registerCustomFunction('customFunction', [], (range: string) => {
      mock(range);
    });

    const compiledExpression = compileExpression('customFunction(A1:B2);');
    runExpression(compiledExpression, {});
    expect(mock).toBeCalledWith('A1:B2');
  });
});
