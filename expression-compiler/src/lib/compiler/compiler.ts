import { Identifier } from './constants';

export class Compiler {
  private constantDefinitions: any = {};
  private localVarablesList: string[] = [];
  private localVarablesTypeList: string[] = [];

  private codeScript = '';

  public compile = (ast: any, values?: any, pluginRegistry?: any) => {
    this.mainProgram(ast);
    //console.log('codeScript', this.codeScript);
    return new Function('payload', `${this.codeScript}`) as unknown as (
      payload?: any
    ) => any;
  };

  mainProgram = (astNode: any) => {
    //console.log('astNode', astNode);
    if (astNode && astNode.body && astNode.type === 'Program') {
      if (astNode.body.length === 1) {
        this.codeScript += 'return ';
      }
      astNode.body.forEach((statementNode: any) => {
        this.statement(statementNode, true);
      });
    }
  };

  statement = (
    statementNode: any,
    isMain?: boolean,
    isPrecompile?: boolean
  ) => {
    if (statementNode && statementNode.type) {
      switch (statementNode.type) {
        case 'BlockStatement':
          this.blockStatement(statementNode);
          break;
        case 'ExpressionStatement':
          this.expressionStatement(statementNode, true);
          break;
        case 'VariableStatement':
          this.variableStatement(statementNode);
          break;
        case 'ConstantStatement':
          this.constantStatement(statementNode);
          break;
        case 'ReturnStatement':
          this.returnStatement(statementNode);
          break;
      }
    }
  };

  constantStatement = (constantStatement: any) => {
    if (constantStatement.id.name) {
      this.constantDefinitions[constantStatement.id.name] =
        constantStatement.value.value;
    }
  };

  blockStatement = (blockStatementNode: any) => {
    if (blockStatementNode && blockStatementNode.body) {
      blockStatementNode.body.forEach((statementNode: any) => {
        this.statement(statementNode, false);
      });
    }
  };

  private getTypeFromNode = (node: any): string => {
    console.log('getTypeFromNode nodeName', node);
    if (node.type === Identifier) {
      if (this.localVarablesList.indexOf(node.name) >= 0) {
        const variableIndex = this.localVarablesList.indexOf(node.name);
        if (variableIndex >= 0) {
          return this.localVarablesTypeList[variableIndex];
        }
      }
    } else if (node.type === 'NumberLiteral') {
      return node.hasDecimals ? 'float' : 'integer';
    } /* else if (node.type === 'CallExpression') {
      if (node.callee.name) {
        const functionIndex = this.functionList.indexOf(node.callee.name);
        if (functionIndex >= 0) {
          return this.functionCode[functionIndex].valType;
        }
      }
    }*/ else if (node.left) {
      return this.getTypeFromNode(node.left);
    }

    return 'float';
  };

  private getTypeFromLeftHandSide = (node: any): string => {
    if (node.left) {
      return this.getTypeFromNode(node.left);
    }

    return this.getTypeFromNode(node);
  };

  expressionStatement = (
    expressionStatementNode: any,
    includeDrop: boolean
  ) => {
    if (expressionStatementNode && expressionStatementNode.expression) {
      const expression = expressionStatementNode.expression;
      this.expression(expression, 'float');
    }
  };

  expression = (expression: any, valType: string) => {
    switch (expression.type) {
      case 'NumberLiteral':
        this.codeScript += `${expression.value}`;
        break;
      case 'Identifier':
        if (expression.name) {
          if (this.constantDefinitions[expression.name] !== undefined) {
            this.codeScript += `${this.constantDefinitions[expression.name]}`;
          } else if (this.localVarablesList.indexOf(expression.name) >= 0) {
            const variableIndex = this.localVarablesList.indexOf(
              expression.name
            );
            if (variableIndex >= 0) {
              this.codeScript += `local_${variableIndex}`;
            }
          } else {
            throw new Error(
              `Unknown variable "${expression.name}" in Expression`
            );
          }
        } else {
          throw new Error(`Identifier without variable found in Expression`);
        }
        break;
      case 'AssignmentExpression':
        if (expression.operator === '=') {
          if (expression.left && expression.left.type === 'Identifier') {
            let valType = 'float';
            if (this.localVarablesList.indexOf(expression.left.name) >= 0) {
              const variableIndex = this.localVarablesList.indexOf(
                expression.left.name
              );
              if (variableIndex >= 0) {
                valType = this.localVarablesTypeList[variableIndex];
              }
            }

            if (this.localVarablesList.indexOf(expression.left.name) >= 0) {
              const variableIndex = this.localVarablesList.indexOf(
                expression.left.name
              );
              if (variableIndex >= 0) {
                this.codeScript += `local_${variableIndex} = `;
              }
            }

            this.binaryExpression(expression.right, valType);
            this.codeScript += ';';
          }
        } else if (expression.operator === '+=') {
          if (expression.left && expression.left.type === 'Identifier') {
            let valType = 'float';
            if (this.localVarablesList.indexOf(expression.left.name) >= 0) {
              const variableIndex = this.localVarablesList.indexOf(
                expression.left.name
              );
              if (variableIndex >= 0) {
                valType = this.localVarablesTypeList[variableIndex];
              }
            }

            if (expression.right.type !== 'NumberLiteral') {
              throw new Error(
                `Unsupported right side "${expression.right.type}" in Expression with operator +=`
              );
            }
            //let initialValue = 0;
            const variableIndex = this.localVarablesList.indexOf(
              expression.left.name
            );
            if (variableIndex >= 0) {
              this.codeScript += `${expression.left.name} = local_${variableIndex};`;
            }

            this.binaryExpression(expression.right, valType);

            this.codeScript += `${expression.left.name} += ${expression.right.value};`;

            if (this.localVarablesList.indexOf(expression.left.name) >= 0) {
              const variableIndex = this.localVarablesList.indexOf(
                expression.left.name
              );
              if (variableIndex >= 0) {
                this.codeScript += `local_${variableIndex} = ${expression.left.name};`;
              }
            } else {
              throw new Error(
                `Unknown variable "${expression.name}" in Expression`
              );
            }
          }
        } else {
          throw new Error(
            `Unknown operator "${expression.operator}" in Expression`
          );
        }
        break;
      case 'BinaryExpression':
        this.binaryExpression(expression.left, valType);

        if (expression.operator === '%' && valType === 'float') {
          throw new Error(
            `Modulo operator not supported for f32: "${expression.operator}" found in BinaryExpression`
          );
        }

        if (expression.operator === '+') {
          this.codeScript += `+`;
        } else if (expression.operator === '-') {
          this.codeScript += `-`;
        } else if (expression.operator === '*') {
          this.codeScript += `*`;
        } else if (expression.operator === '/') {
          this.codeScript += `/`;
        } else if (expression.operator === '%') {
          this.codeScript += `%`;
        } else if (expression.operator === '==') {
          this.codeScript += `==`;
        } else if (expression.operator === '!=') {
          this.codeScript += `!=`;
        } else if (expression.operator === '>=') {
          this.codeScript += `>=`;
        } else if (expression.operator === '<=') {
          this.codeScript += `<=`;
        } else if (expression.operator === '>') {
          this.codeScript += `>`;
        } else if (expression.operator === '<') {
          this.codeScript += `<`;
        } else {
          throw new Error(
            `Unknown operator "${expression.operator}" found in BinaryExpression`
          );
        }

        this.binaryExpression(expression.right, valType);
        break;
      case 'LogicalExpression': {
        this.binaryExpression(expression.left, valType);
        this.binaryExpression(expression.right, valType);

        let useValType = 'float';
        const outputType =
          expression.left?.outputType ?? expression.right?.outputType ?? '';
        if (outputType === 'integer') {
          useValType = 'integer';
        }

        if (expression.operator === '&&' || expression.operator === 'and') {
          this.codeScript += `${expression.left.name} && ${expression.right.name}`;
        } else if (
          expression.operator === '||' ||
          expression.operator === 'or'
        ) {
          this.codeScript += `${expression.left.name} || ${expression.right.name}`;
        }

        // TODO : xor .. shl .. shr .. rot etc..

        break;
      }
    }
    return true;
  };

  binaryExpression = (expressionNode: any, valType: string) => {
    switch (expressionNode.type) {
      case 'MemberExpression': {
        console.log('MemberExpression', expressionNode);
        if (
          expressionNode.object &&
          expressionNode.object.type === 'MemberExpression'
        ) {
          this.binaryExpression(expressionNode.object, valType);
          if (
            expressionNode.property &&
            expressionNode.property.type === 'Identifier'
          ) {
            this.codeScript += `.${expressionNode.property.name}`;
          } else {
            throw new Error(
              `Unsupported property "${expressionNode.property.type}" in MemberExpression`
            );
          }
        } else if (
          expressionNode.object &&
          expressionNode.object.type === 'Identifier'
        ) {
          if (
            expressionNode.property &&
            expressionNode.property.type === 'Identifier'
          ) {
            this.codeScript += `payload.${expressionNode.object.name}.${expressionNode.property.name}`;
          } else {
            throw new Error(
              `Unsupported property "${expressionNode.property.type}" in MemberExpression`
            );
          }
        }
        break;
      }
      case 'LogicalExpression':
        this.expression(expressionNode, valType);
        break;
      case 'BinaryExpression':
        this.expression(expressionNode, valType);
        break;
      case 'UnaryExpression':
        if (expressionNode.operator === '-') {
          if (
            expressionNode.argument &&
            expressionNode.argument.type === 'NumberLiteral'
          ) {
            if (valType === 'integer') {
              this.codeScript += `-${expressionNode.argument.value | 0}`;
            } else {
              this.codeScript += `-${expressionNode.argument.value}`;
            }
            break;
          }
        } else {
          throw new Error(
            `UnaryExpression "${expressionNode.operator}" cannot be handled`
          );
        }
        break;
      case 'NumberLiteral':
        this.codeScript += `${expressionNode.value | 0}`;
        break;
      case 'Identifier':
        if (expressionNode.name) {
          if (this.constantDefinitions[expressionNode.name] !== undefined) {
            this.codeScript += `${
              this.constantDefinitions[expressionNode.name]
            };`;
          } else if (this.localVarablesList.indexOf(expressionNode.name) >= 0) {
            const variableIndex = this.localVarablesList.indexOf(
              expressionNode.name
            );
            if (variableIndex >= 0) {
              this.codeScript += `local_${variableIndex}`;
            }
          } else {
            this.codeScript += `payload.${expressionNode.name}`;
          }
        } else {
          throw new Error(
            `Identifier without variable found in BinaryExpression`
          );
        }
        break;
    }
  };

  variableStatement = (variableNode: any) => {
    if (variableNode.declarations) {
      variableNode.declarations.forEach((variableDeclaration: any) => {
        if (variableDeclaration.type === 'VariableDeclaration') {
          if (
            variableDeclaration.id &&
            variableDeclaration.id.type === 'Identifier'
          ) {
            if (
              variableDeclaration.init &&
              variableDeclaration.init.type === 'NumberLiteral'
            ) {
              if (variableNode.variableType === 'integer') {
                this.localVarablesTypeList.push('integer');
                this.localVarablesList.push(variableDeclaration.id.name);

                this.codeScript += `let local_${
                  this.localVarablesList.length - 1
                } = ${variableDeclaration.init.value | 0};`;
              } else if (variableNode.variableType === 'float') {
                this.localVarablesTypeList.push('float');
                this.localVarablesList.push(variableDeclaration.id.name);
                this.codeScript += `let local_${
                  this.localVarablesList.length - 1
                } = ${variableDeclaration.init.value | 0};`;
              } else {
                this.localVarablesTypeList.push('string');
                this.localVarablesList.push(variableDeclaration.id.name);

                this.codeScript += `let local_${
                  this.localVarablesList.length - 1
                } = ${variableDeclaration.init.value | 0};`;
              }
            } else {
              throw new Error('Variable initializer can only be a number.');
            }
          }
        }
      });
    }
  };

  returnStatement = (returnStatementNode: any) => {
    if (returnStatementNode.argument) {
      this.codeScript += `return `;
      this.binaryExpression(
        returnStatementNode.argument,
        this.getTypeFromNode(returnStatementNode.argument)
      );
      this.codeScript += `;`;
    }
  };
}
