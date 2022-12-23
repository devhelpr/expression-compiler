// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  CompileExpression,
  RunExpression,
} from '@expression-compiler/expression-compiler';

export function App() {
  const compiledExpression = CompileExpression('a + b');
  /*
    a + b 

    payload.a + payload.b

  */
  const result = RunExpression(
    compiledExpression as unknown as (payload: any) => any,
    { a: 2, b: 3 }
  );
  return (
    <div>
      <h1>Expression compiler!</h1>
      <p>Result: {result.toString()}</p>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export default App;
