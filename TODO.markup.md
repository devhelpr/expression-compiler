# optionally support for markup

when expression-compiler has "supportMarkup" is true then the following is allowed and will be parsed to the AST

function Component() {
    return <Markup>test<Markup>;
}

function Component() {
    let a = 2;
    let b = 3;
    let test = <Markup>{a+b}</Markup>;
    return test;
}

function App() {
    return <Component></Component>;
}

thoughts:
- mark Component and App functions as "markup" functions in the AST?


## follow up questions
- should there be a markup type for variables so that they can be assigned directly?
    let markup : Markup;
    markup = <Markup>test</Markup>;
    if(some condition) {
        markup = <Markup>some condition is true</Markup>;
    }

- how to compile this to JS in a flexible way not tied to a specific implementation like DOM/createElement?
    - specify "render"-function to the compiler? 
        input should be markup-tree
        output should be JS-code as string

    - how to handle expressions within markup??


- how to handle expression inside the Markup?

function Component() {
    let a = 2;
    let b = 3;
    let test = <Markup>{a+b}</Markup>;
    return test;
}
.. after parsing the inital tree.. walk through the AST and for each markup search for expressions and compile these...
.. should be handled by the compiler later on