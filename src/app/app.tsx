// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  compileExpression,
  compileExpressionAsScriptNode,
  deleteExpressionScriptNode,
  registerCustomFunction,
  runExpression,
} from '@devhelpr/expression-compiler';
import { useEffect, useState } from 'react';

registerCustomFunction('customFunction', [], (a, b, c) => {
  console.log('customFunction called', a, b, c);
});

registerCustomFunction('sum', [], (payload, a: string) => {
  console.log('sum', payload, a);
  return 3;
});

export function App() {
  const [resultScript, setResultScript] = useState<any>(null);
  const [result, setResult] = useState('');
  useEffect(() => {
    //const compiledExpression = compileExpression(`customFunction(A1:B1,A2,3)`);
    const compiledExpression = compileExpression(`25+5`);
    const expressionInfo = compileExpressionAsScriptNode(
      `customFunction(a,b,c);
      return sum(payload, "A1:B2")+sum(payload, "Column:B")+sum(payload, "Row:1")+a+b+c;
    `
    );
    console.log(
      'expressionInfo.expressionFunction',
      expressionInfo.expressionFunction({
        a: 1,
        b: 2,
        c: 3,
      })
    );
    setResultScript(
      expressionInfo.expressionFunction({
        a: 1,
        b: 2,
        c: 3,
      })
    );
    /*let loop=0;
  let test = "test";
  let test2 = "hello";
  customFunction(2,3, 5 );
  if (test == "test" && test2 == "hello") {
    loop = loop + 5;
  }
  loop;
  */
    //   function test() {
    //     return 2;
    //   }
    //   return test();
    // `);

    //2+3`);
    //if (20*3 > 20) {return true;} else {return false;}`);

    //a+b.x.y.abc+2`);
    //b.x.y.abc`);

    /*

  let x : integer = 1;
  x

    a + b 

    payload.a + payload.b

  */
    setResult(
      runExpression(compiledExpression, {
        a: 2,
        b: { x: { y: { abc: 10 } } },
      })
    );

    return () => {
      deleteExpressionScriptNode(expressionInfo.id);
    };
  }, []);
  return (
    <div>
      <h1>Expression compiler!</h1>
      <p>Result: {(result || 0).toString()}</p>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <p>resultScript: {JSON.stringify(resultScript, null, 2)}</p>
    </div>
  );
}

export default App;
