# ExpressionCompiler

Expression/script to javascript compiler.
See [readme for expression-compiler npm package](expression-compiler/README.md) for more info

## Publishing


... manually increase version or .. npm version ...
yarn nx build @devhelpr/expression-compiler

cd dist/expression-compiler
npm publish --access public
(login to npm first.. "npm login")


## new publishable library

 npx nx g @nrwl/react:library exprcomp --publishable --importPath @devhelpr/exprcomp

## todo

- [ ] add types (no more any)
- [ ] add tests