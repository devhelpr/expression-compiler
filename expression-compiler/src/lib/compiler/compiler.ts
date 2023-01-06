import { IASTTree } from '../interfaces/ast';
import {
  CustomFunctionRegistry,
  ICustomFunction,
} from '../interfaces/custom-functions';
import { Body, Identifier } from './constants';

export class Compiler {
  private constantDefinitions: any = {};
  private localVarablesList: string[] = [];
  private localVarablesTypeList: string[] = [];

  private codeScript = '';

  private functionList: string[] = [];
  private functionCode: any[] = [];
  private functionReturnValtype = 'float';

  private customFunctions: CustomFunctionRegistry = {};
  public currentFunction = '';

  public compile = (ast: IASTTree, values?: any) => {
    const customBindings: any = {};
    Object.keys(this.customFunctions).forEach((key) => {
      const customFunction: ICustomFunction = this.customFunctions[key];
      customBindings[customFunction.functionName] =
        customFunction.customFunction;
    });

    this.mainProgram(ast);
    //console.log('codeScript', this.codeScript);
    return { script: this.codeScript, bindings: customBindings };
  };

  public setCustomFunctionRegistry = (
    customFunctions: CustomFunctionRegistry
  ) => {
    this.customFunctions = customFunctions;
  };

  mainProgram = (astNode: IASTTree) => {
    //console.log('astNode', astNode);
    if (astNode && astNode.body && astNode.type === 'Program') {
      astNode.body.forEach((statementNode: any, index: number) => {
        if (
          index === astNode.body.length - 1 &&
          statementNode.type === 'ExpressionStatement'
        ) {
          this.codeScript += 'return ';
        }
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
        case 'IfStatement':
          this.ifStatement(statementNode);
          break;
        case 'WhileStatement':
          this.whileStatement(statementNode);
          break;
        case 'FunctionDeclaration':
          this.functionDeclaration(statementNode);
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
      case 'RangeLiteral':
        this.codeScript += `"${expression.value || ''}"`;
        break;
      case 'RowLiteral':
        this.codeScript += `"${expression.value || ''}"`;
        break;
      case 'ColumnLiteral':
        this.codeScript += `"${expression.value || ''}"`;
        break;
      case 'BooleanLiteral':
        this.codeScript += `${expression.value ? 'true' : 'false'}`;
        break;
      case 'NumberLiteral':
        this.codeScript += `${expression.value}`;
        break;
      case 'StringLiteral':
        this.codeScript += `"${expression.value || ''}"`;
        break;
      case 'PayloadLiteral':
        this.codeScript += `payload`;
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

        let useValType = 'float';
        const outputType =
          expression.left?.outputType ?? expression.right?.outputType ?? '';
        if (outputType === 'integer') {
          useValType = 'integer';
        }

        if (expression.operator === '&&' || expression.operator === 'and') {
          this.codeScript += ` && `;
        } else if (
          expression.operator === '||' ||
          expression.operator === 'or'
        ) {
          this.codeScript += ` || `;
        }

        this.binaryExpression(expression.right, valType);

        // TODO : xor .. shl .. shr .. rot etc..

        break;
      }
      case 'MemberExpression': {
        this.memberExpression(expression);
        break;
      }
      case 'CallExpression': {
        this.callExpression(expression);
        this.codeScript += `;`;
        break;
      }
    }
    return true;
  };

  memberExpression = (expressionNode: any) => {
    if (
      expressionNode.object &&
      expressionNode.object.type === 'MemberExpression'
    ) {
      this.binaryExpression(expressionNode.object, 'float');
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
  };

  binaryExpression = (expressionNode: any, valType: string) => {
    switch (expressionNode.type) {
      case 'MemberExpression': {
        this.memberExpression(expressionNode);
        break;
      }
      case 'CallExpression': {
        this.callExpression(expressionNode);
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
      case 'RangeLiteral':
        this.codeScript += `"${expressionNode.value || ''}"`;
        break;
      case 'RowLiteral':
        this.codeScript += `"${expressionNode.value || ''}"`;
        break;
      case 'ColumnLiteral':
        this.codeScript += `"${expressionNode.value || ''}"`;
        break;
      case 'BooleanLiteral':
        this.codeScript += `${expressionNode.value ? 'true' : 'false'}`;
        break;
      case 'NumberLiteral':
        this.codeScript += `${expressionNode.value | 0}`;
        break;
      case 'StringLiteral':
        this.codeScript += `"${expressionNode.value || ''}"`;
        break;
      case 'PayloadLiteral':
        this.codeScript += `payload`;
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
              variableDeclaration.init.type === 'StringLiteral'
            ) {
              //if (variableNode.variableType === 'string') {
              this.localVarablesTypeList.push('string');
              this.localVarablesList.push(variableDeclaration.id.name);

              this.codeScript += `let local_${
                this.localVarablesList.length - 1
              } = "${variableDeclaration.init.value || ''}";`;
              //}
            } else if (
              variableDeclaration.init &&
              variableDeclaration.init.type === 'NumberLiteral'
            ) {
              this.localVarablesTypeList.push('integer');
              this.localVarablesList.push(variableDeclaration.id.name);

              this.codeScript += `let local_${
                this.localVarablesList.length - 1
              } = ${variableDeclaration.init.value | 0};`;
              /*  
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
              */
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
      this.expression(
        returnStatementNode.argument,
        this.getTypeFromNode(returnStatementNode.argument)
      );
      this.codeScript += `;`;
    }
  };

  ifStatement = (ifStatementNode: any) => {
    /*
			test .. BinaryExpression
			consequent : BlockStatement..
			alternate : BlockStatement
		*/
    if (ifStatementNode.test && ifStatementNode.consequent) {
      const test = ifStatementNode.test;
      const valType = this.getTypeFromLeftHandSide(test);

      const consequent = ifStatementNode.consequent;
      this.codeScript += `if (`;
      if (
        test.type === 'BinaryExpression' ||
        test.type === 'LogicalExpression'
      ) {
        this.expression(test, valType);
      } else {
        this.codeScript += `true`;
      }
      this.codeScript += `) {`;

      if (consequent) {
        this.statement(consequent);
      }

      this.codeScript += `}`;

      if (ifStatementNode.alternate) {
        this.codeScript += ` else {`;
        this.statement(ifStatementNode.alternate);
        this.codeScript += `}`;
      }
    }
  };

  whileStatement = (whileStatementNode: any) => {
    /*
			test
			body
		*/
    if (
      whileStatementNode.test &&
      whileStatementNode.body &&
      whileStatementNode.body.body
    ) {
      const test = whileStatementNode.test;

      if (whileStatementNode.body.body.length > 0) {
        // Prevent infinite loops
        //
        // only allow simple while loops :
        //   while (loop < ...) {
        //     loop = loop + 1;
        //   }
        //
        //   Additional increading of variable which is currently allowed:
        //     loop += 1;

        let hasAssignmentExpressionWithVariableFromTest = false;
        const testVariableName = test.left.name;
        whileStatementNode.body.body.forEach((statement: any) => {
          if (statement.type === 'ExpressionStatement') {
            if (
              statement.expression &&
              statement.expression.type === 'AssignmentExpression'
            ) {
              if (
                statement.expression.left.name === testVariableName &&
                (statement.expression.operator === '=' ||
                  statement.expression.operator === '+=')
              ) {
                hasAssignmentExpressionWithVariableFromTest = true;
              }
            }
          }
        });

        if (!hasAssignmentExpressionWithVariableFromTest) {
          throw new Error(`While expression found without valid body`);
        }

        /*let testCondition : any = 1;
        
        testCondition = interpretateExpression(test);

        while (testCondition == 1) {
          result = interpretateStatement(whileStatementNode.body);
          if (test.type === "BinaryExpression") {
            testCondition = interpretateExpression(test);
          } else {
            break;
          }
        }*/

        this.codeScript += `while (`;
        this.expression(test, 'float');
        this.codeScript += `) {`;
        this.statement(whileStatementNode.body);
        this.codeScript += `}`;
      }
    }
  };

  functionDeclaration = (functionDeclarationNode: any) => {
    if (
      functionDeclarationNode.name &&
      functionDeclarationNode.name.type !== 'Identifier'
    ) {
      throw new Error(
        `Unknown function name type "${functionDeclarationNode.name.type}"`
      );
    }

    const storeCode = this.codeScript;
    const storeLocalVariables = [...this.localVarablesList];
    const storeLocalVarablesTypeList = [...this.localVarablesTypeList];

    this.codeScript = `function ${functionDeclarationNode.name.name} (`;

    this.localVarablesList = [];
    this.localVarablesTypeList = [];
    this.functionList.push(functionDeclarationNode.name.name);
    this.currentFunction = functionDeclarationNode.name.name;

    functionDeclarationNode.params.forEach((param: any) => {
      if (param.identifier.type === 'Identifier') {
        this.localVarablesList.push(param.identifier.name);
        this.localVarablesTypeList.push(param.parameterType);
      } else {
        throw new Error(
          `Unknown parameter type "${param.identifier.type}" in "${functionDeclarationNode.name.name}"`
        );
      }
    });
    this.codeScript += `){`;
    this.blockStatement(functionDeclarationNode.body);

    this.codeScript += `};`;

    this.functionCode.push({
      name: functionDeclarationNode.name.name,
      code: this.codeScript,
      paramCount: functionDeclarationNode.params.length,
      params: [...functionDeclarationNode.params],
      localVarablesList: [...this.localVarablesList],
      localVarablesTypeList: [...this.localVarablesTypeList],
      valType: this.functionReturnValtype,
    });

    this.codeScript = storeCode;

    this.codeScript += this.functionCode[this.functionCode.length - 1].code;

    this.localVarablesList = storeLocalVariables;
    this.localVarablesTypeList = storeLocalVarablesTypeList;

    this.currentFunction = Body;
  };

  callExpression = (expressionNode: any) => {
    const functionDeclaration = this.functionCode.filter((declaration) => {
      return declaration.name === expressionNode.callee.name;
    });

    if (functionDeclaration.length > 0) {
      if (
        expressionNode.arguments.length !== functionDeclaration[0].paramCount
      ) {
        throw new Error(
          `Function ${functionDeclaration[0].name} expected ${functionDeclaration[0].paramCount} parameters but ${expressionNode.arguments.length} given`
        );
      }
    }

    const customFunction = this.customFunctions[expressionNode.callee.name];
    if (customFunction) {
      this.codeScript += `this.${expressionNode.callee.name}(`;
      if (customFunction.receivePayloadAsFirstParameter) {
        this.codeScript += `payload`;
        if (expressionNode.arguments.length > 0) {
          this.codeScript += `,`;
        }
      }
    } else {
      this.codeScript += `${expressionNode.callee.name}(`;
    }
    expressionNode.arguments.forEach(
      (argumentExpression: any, index: number) => {
        let paramType = 'float';

        if (functionDeclaration.length > 0) {
          if (index < functionDeclaration[0].localVarablesTypeList.length) {
            paramType = functionDeclaration[0].localVarablesTypeList[index];
          }
        }
        this.binaryExpression(argumentExpression, paramType);
        if (index < expressionNode.arguments.length - 1) {
          this.codeScript += `,`;
        }
      }
    );

    const functionIndex = this.functionList.indexOf(expressionNode.callee.name);

    if (functionIndex < 0 && !customFunction) {
      throw new Error(`function ${expressionNode.callee.name} not found`);
    }

    this.codeScript += `)`;

    return true;
  };
}
