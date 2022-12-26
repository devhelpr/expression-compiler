# ExpressionCompiler

Expression/script to javascript compiler.
See [readme for expression-compiler npm package](expression-compiler/README.md) for more info

## Publishing

yarn nx build @devhelpr/expression-compiler

for now .. manually copy dist directory to expression-compiler folder (until we figured out how to do this correctly using package json and vite/tsconfig settings)

cd expression-compiler
... manually increase version or .. npm version ...
npm publish --access public
(login to npm first.. "npm login")