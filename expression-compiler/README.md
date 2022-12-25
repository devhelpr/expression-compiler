# expression-compiler

## Description

Expression/script to javascript compiler.
Expressions can use external variables.
Expression can be simple calculations or logic statement but can also be multi-line programs using variables/if/while/function-statements.
Expressions can contain comments.
The expression language is a basic javascript/c like syntax.

Keywords : let, if, while, function, return
Operators: +,-,*,/,=,==,&&,|| etc..
Blocks : { .. }
Parameters : ( .. )

## Basic example

```
import {
  compileExpression,
  runExpression,
} from '@devhelpr/expression-compiler';

const compiledExpression = compileExpression("1+2");
const result = runExpression(compiledExpression,{});
```

## Example with external variables
```
import {
  compileExpression,
  runExpression,
} from '@devhelpr/expression-compiler';

const compiledExpression = compileExpression("a*b");
const result = runExpression(compiledExpression, {
    a:2, 
    b:3
});
```

## Example with basic while loop
```
import {
  compileExpression,
  runExpression,
} from '@devhelpr/expression-compiler';

const compiledExpression = compileExpression(`
let loop = 0;
while (loop < 10) {
    loop = loop + 1;
}
loop;
`);
const result = runExpression(compiledExpression, {
    a:2, 
    b:3
});
```

## Development

Run tests:

npm run test @devhelpr/expression-compiler

