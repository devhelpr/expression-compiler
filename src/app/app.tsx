// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  compileExpression,
  compileExpressionAsScriptNode,
  deleteExpressionScriptNode,
  expressionAST,
  ICompiledScriptExpression,
  registerCustomFunction,
  runExpression,
} from '@devhelpr/expression-compiler';
import { useEffect, useState } from 'react';

registerCustomFunction('customFunction', [], (a, b, c) => {
  console.log('customFunction called', a, b, c);
});

registerCustomFunction('random', [], (a) => {
  return Math.round(Math.random() * (a || 100));
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
    /*const expression = `
      let list : [] = [2,24,5];
      let listCopy : [];
      list.push(25);
      list[3] = 10;
      let loop = 0;
      let sum = 0;
      listCopy = list;

      listCopy = filter x in list where x > 5;

      map item in list to {
        let x = 0;
        x = item * 4;
        x;
      }
      forEach item in list {
        sum = sum + item;
      }
      forEach item in listCopy {
        sum = sum + item;
      }
      customFunction(list);
      customFunction(listCopy);
      
      sum`;

    */
    /*

    while (loop < list.length) {
        sum  = sum + list[loop];
        loop = loop + 1;
      }
        forEach item in list {
            sum = sum + item;
            //sum += item;
        }
        
        map item in list to {
          item * 3;
        }

        filter x in list where x > 3;

        filter list forEach item where item > 3
        filter list forEach item with {
          let value = 3;
          item > value;
        }

      */

    const expression = `function test() {
      let component = <test>2</test>;
      return component;
    }
    return test();
    `;
    const expressionInfo: ICompiledScriptExpression | undefined = undefined;
    try {
      //   console.log('AST', expressionAST(expression, true));
      //   const compiledExpression = compileExpression(
      //     expression,
      //     true,
      //     (markup) => {
      //       return `"markup"`;
      //     }
      //   );
      //   console.log('compiledExpression', compiledExpression);
      //   expressionInfo = compileExpressionAsScriptNode(
      //     `customFunction(a,b,c);
      //   return sum(payload, "A1:B2")+sum(payload, "Column:B")+sum(payload, "Row:1")+a+b+c;
      // `
      //   );
      //   console.log(
      //     'expressionInfo.expressionFunction',
      //     expressionInfo.expressionFunction({
      //       a: 1,
      //       b: 2,
      //       c: 3,
      //     })
      //   );
      //   setResultScript(
      //     expressionInfo.expressionFunction({
      //       a: 1,
      //       b: 2,
      //       c: 3,
      //     })
      //   );

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
      //const compiledExpression = compileExpression(`sum() * 4`);

      const compiledExpression = compileExpression(
        //`arr[index] < arr[index + 1]`
        //`arr.length`
        //'obj1.key == obj2.key'
        //'obj2.key[0]'
        //'(factor - index) * 5'
        //'[1,2,3,4]'
        //'[random(200),random(500),random(),random()]'
        //'random()',
        '[]'
      );
      console.log('compiledExpression', compiledExpression);
      const exprresult = runExpression(compiledExpression, {
        a: 2,
        b: { x: { y: { abc: 10 } } },
        arr: [0, 1, 2, 3],
        obj1: {
          key: 'abc',
        },
        obj2: {
          key: 'abc',
        },
        test: 'abc',
        index: 1,
        factor: 5,
      });
      setResult(exprresult);
    } catch (e) {
      setResult(e as unknown as string);
    }

    // const test = compileExpression(`sum() * 4`);
    // console.log('test', runExpression(test,{}));
    return () => {
      // if (expressionInfo) {
      //   deleteExpressionScriptNode(expressionInfo.id);
      // }
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
