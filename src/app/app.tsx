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

  const compiledExpression = compileExpression(`

  let loop=0;
  let test = "test";
  customFunction(2,3,'test');
  if (test == "test") {
    loop = loop + 5;
  }
  loop;
  
  `);

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
