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

  it('should return object key value', () => {
    const payload = {
      a: {
        b: 123,
      },
    };
    const compiledExpression = compileExpression('a.b');
    const result = runExpression(compiledExpression, payload);
    expect(result).toBe(123);
  });

  it('should comapre object key property values', () => {
    const payload = {
      a: {
        b: 123,
      },
      c: {
        d: 456,
      },
    };
    const compiledExpression = compileExpression('a.b < c.d');
    const result = runExpression(compiledExpression, payload);
    expect(result).toBe(true);
  });

  it('should comapre object key property string values', () => {
    const payload = {
      a: {
        b: 'abc',
      },
      c: {
        d: 'def',
      },
    };
    const compiledExpression = compileExpression('a.b < c.d');
    const result = runExpression(compiledExpression, payload);
    expect(result).toBe(true);
  });

  it('should return array values', () => {
    const payload = {
      a: [1, 2, 3],
    };
    const compiledExpression = compileExpression('a[0] + a[1] + a[2]');
    const result = runExpression(compiledExpression, payload);
    expect(result).toBe(6);
  });

  it('should return character value by index ', () => {
    const payload = {
      a: 'test',
    };
    const compiledExpression = compileExpression('a[0]');
    const result = runExpression(compiledExpression, payload);
    expect(result).toBe('t');
  });

  it('should return character value by index in a nested object', () => {
    const payload = {
      a: {
        b: 'test',
      },
    };
    const compiledExpression = compileExpression('a.b[0]');
    const result = runExpression(compiledExpression, payload);
    expect(result).toBe('t');
  });

  it('should return last array value', () => {
    const payload = {
      a: [1, 2, 3],
    };
    const compiledExpression2 = compileExpression('a[-1]');
    console.log('compiledExpression2', compiledExpression2);
    const result2 = runExpression(compiledExpression2, payload);
    expect(result2).toBe(3);

    // const compiledExpressionInfo =
    //   compileExpressionAsInfo('a[0] + a[1] + a[2]');
    // const expressionFunction = (
    //   new Function(
    //     'payload',
    //     `${compiledExpressionInfo.script}`
    //   ) as unknown as (payload?: any) => any
    // ).bind(compiledExpressionInfo.bindings);
    // expect(() =>
    //   runExpression(
    //     expressionFunction,
    //     payload,
    //     false,
    //     compiledExpressionInfo.payloadProperties
    //   )
    // ).toBe(6);
  });

  it('should return value of array index + 1', () => {
    const payload = {
      a: [1, 2, 3],
      index: 1,
    };
    const compiledExpression2 = compileExpression('a[index+1]');
    console.log('compiledExpression2', compiledExpression2);
    const result2 = runExpression(compiledExpression2, payload);
    expect(result2).toBe(3);
  });

  it('should return value true when arr[index] < arr[index+1]', () => {
    const payload = {
      a: [1, 2, 3],
      index: 1,
    };
    const compiledExpression2 = compileExpression('a[index] < a[index+1]');
    console.log('compiledExpression2', compiledExpression2);
    const result2 = runExpression(compiledExpression2, payload);
    expect(result2).toBe(true);
  });

  it('should return correctarray length', () => {
    const payload = {
      a: [1, 2, 3, 4, 5],
      index: 1,
    };
    const compiledExpression2 = compileExpression('a.length');
    console.log('compiledExpression2', compiledExpression2);
    const result2 = runExpression(compiledExpression2, payload);
    expect(result2).toBe(5);
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
