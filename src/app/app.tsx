// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  compileExpression,
  registerCustomFunction,
  runExpression,
} from '@devhelpr/expression-compiler';

export function App() {
  registerCustomFunction('customFunction', [], (a, b, c) => {
    console.log('customFunction called', a, b, c);
  });

  const compiledExpression = compileExpression(`customFunction(A1:B1,A2,3)`);

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
  const result = runExpression(compiledExpression, {
    a: 2,
    b: { x: { y: { abc: 10 } } },
  });
  console.log('result', result);
  return (
    <div>
      <h1>Expression compiler!</h1>
      <p>Result: {(result || 0).toString()}</p>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export default App;
