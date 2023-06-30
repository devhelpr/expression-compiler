import {
  compileExpression,
  compileExpressionAsInfo,
  expressionAST,
  registerCustomBlock,
  registerCustomFunction,
  runExpression,
} from './expression-compiler';

describe('ExpressionCompiler', () => {
  it('should return true for the expression 2 + 5 == 7', () => {
    const compiledExpression = compileExpression('2 + 5 == 7');
    expect(compiledExpression).toBeTruthy();

    const result = runExpression(compiledExpression, {});
    expect(result).toBe(true);
  });

  it('should return false for the expression 2 + 5 == 8', () => {
    const compiledExpression = compileExpression('2 + 5 == 8');
    expect(compiledExpression).toBeTruthy();

    const result = runExpression(compiledExpression, {});
    expect(result).toBe(false);
  });

  it('should return true for the expression 2 + 5 == (3 * 7) / 3', () => {
    const compiledExpression = compileExpression('2 + 5 == (3 * 7) / 3');
    expect(compiledExpression).toBeTruthy();

    const result = runExpression(compiledExpression, {});
    expect(result).toBe(true);
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

  it('should custom function be called with parameters and can result be multiplied', () => {
    const mock = vi.fn();
    registerCustomFunction('customFunction', [], (a: number, b: number) => {
      mock(a, b);
      return a + b;
    });

    const compiledExpression = compileExpression('customFunction(1, 2) * 4');
    const result = runExpression(compiledExpression, {});
    expect(result).toBe(12);
    expect(mock).toBeCalledWith(1, 2);
    console.log('customFunction(1,2) * 4', result);
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

  it('should return an ast when supportsMarkup', () => {
    const spyMock = vi.fn();
    const compiledExpression = compileExpression(
      `function test() {
      return <Markup>test</Markup>;
    }`,
      true,
      (markup) => {
        spyMock();
        return `"markup"`;
      }
    );
    expect(compiledExpression).toBeTruthy();
    expect(spyMock).toBeCalled();
  });

  it('should return an ast when supportsMarkup and variable is initialized with markup', () => {
    const spyMock = vi.fn();
    const compiledExpression = compileExpression(
      `function test() {
        let markup = <Markup>test</Markup>;
      return markup;
    }`,
      true,
      (markup) => {
        spyMock();
        return `"markup"`;
      }
    );
    expect(compiledExpression).toBeTruthy();
    expect(spyMock).toBeCalled();
  });

  it('should have a custom block in the AST when customBlock is provided', () => {
    registerCustomBlock('customBlock');
    const ast = expressionAST(
      `
    customBlock {
      return 42;
    }`,
      false
    );
    console.log('ast', ast);
    expect(ast).toBeTruthy();
  });

  it('should call custom block when customBlock is provided', () => {
    registerCustomBlock('customBlock');
    const compiledExpression = compileExpression(
      `
      let a = 42;
      customBlock {
        let b = 5;
        a = a + b;
        a = a + c;
        return a;
      }
    `
    );
    const result = runExpression(compiledExpression, {});
    console.log(result);
    const blockResult = result.customBlock({ c: 6 });
    expect(blockResult).toBe(53);
  });

  it("should throw error if variable in expression doesn't exist in payload", () => {
    const compiledExpressionInfo = compileExpressionAsInfo(`test`);
    const expressionFunction = (
      new Function(
        'payload',
        `${compiledExpressionInfo.script}`
      ) as unknown as (payload?: any) => any
    ).bind(compiledExpressionInfo.bindings);
    expect(() =>
      runExpression(
        expressionFunction,
        {},
        true,
        compiledExpressionInfo.payloadProperties
      )
    ).toThrowError('Unknown variable test');
  });
});
