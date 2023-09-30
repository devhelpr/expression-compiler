import { IASTTree } from '../interfaces/ast';
import {
  CustomFunctionRegistry,
  ICustomFunction,
} from '../interfaces/custom-functions';
import { Body, Identifier } from './constants';
import { IASTTree as IASTMarkupTree } from '@devhelpr/markup-compiler';

export class Compiler {
  private constantDefinitions: any = {};
  private localVarablesList: string[] = [];
  private localVarablesTypeList: string[] = [];

  private codeScript = '';

  private functionList: string[] = [];
  private functionCode: any[] = [];
  private functionReturnValtype = 'float';

  private customFunctions: CustomFunctionRegistry = {};
  private customBlocks: any = {};
  private hasCustomBlocks = false;

  private markupCompiler?: (markup: IASTMarkupTree) => string;

  private payloadProperties: string[] = [];

  public currentFunction = '';
  public setupMarkupCompiler = (
    markupCompiler: (markup: IASTMarkupTree) => string
  ) => {
    this.markupCompiler = markupCompiler;
  };

  public compile = (ast: IASTTree, values?: any) => {
    const customBindings: any = {};
    Object.keys(this.customFunctions).forEach((key) => {
      const customFunction: ICustomFunction = this.customFunctions[key];
      customBindings[customFunction.functionName] =
        customFunction.customFunction;
    });

    this.mainProgram(ast);
    //console.log('codeScript', this.codeScript);
    return {
      script: this.codeScript,
      bindings: customBindings,
      payloadProperties: this.payloadProperties,
    };
  };

  public setCustomFunctionRegistry = (
    customFunctions: CustomFunctionRegistry
  ) => {
    this.customFunctions = customFunctions;
  };

  public setCustomBlockRegistry = (customBlocks: any) => {
    this.customBlocks = customBlocks;
  };

  mainProgram = (astNode: IASTTree) => {
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

      if (this.hasCustomBlocks) {
        this.codeScript += `return {`;

        Object.keys(this.customBlocks).forEach((key, index) => {
          if (index > 0) {
            this.codeScript += `,`;
          }
          const customBlock = this.customBlocks[key];
          this.codeScript += `${key}: ${customBlock.functionName}`;
        });

        this.codeScript += `};`;
      }
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
        case 'CustomBlockStatement':
          this.customBlockStatement(statementNode);
          break;
        case 'ExpressionStatement':
          this.expressionStatement(statementNode);
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
        case 'ForEachStatement':
          this.forEachStatement(statementNode);
          break;

        case 'MapStatement':
          this.mapStatement(statementNode);
          break;

        case 'FilterStatement':
          this.filterStatement(statementNode);
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

  customBlockStatement = (blockStatementNode: any) => {
    if (blockStatementNode && blockStatementNode.body) {
      this.hasCustomBlocks = true;

      const storeCode = this.codeScript;
      const storeLocalVariables = [...this.localVarablesList];
      const storeLocalVarablesTypeList = [...this.localVarablesTypeList];

      this.codeScript = `function block_${blockStatementNode.name} (payload){`;

      this.currentFunction = `block_${blockStatementNode.name}`;
      if (this.customBlocks[blockStatementNode.name]) {
        this.customBlocks[
          blockStatementNode.name
        ].functionName = `block_${blockStatementNode.name}`;
      }
      this.localVarablesList = [...this.localVarablesList];
      this.localVarablesTypeList = [...this.localVarablesTypeList];

      blockStatementNode.body.forEach((statementNode: any) => {
        this.statement(statementNode, false);
      });

      this.codeScript += `};`;
      const customBlockCodeScript = this.codeScript;

      // this.functionCode.push({
      //   name: functionDeclarationNode.name.name,
      //   code: this.codeScript,
      //   paramCount: functionDeclarationNode.params.length,
      //   params: [...functionDeclarationNode.params],
      //   localVarablesList: [...this.localVarablesList],
      //   localVarablesTypeList: [...this.localVarablesTypeList],
      //   valType: this.functionReturnValtype,
      // });

      this.codeScript = storeCode;

      this.codeScript += customBlockCodeScript;

      this.localVarablesList = storeLocalVariables;
      this.localVarablesTypeList = storeLocalVarablesTypeList;

      this.currentFunction = Body;
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

  expressionStatement = (expressionStatementNode: any) => {
    if (expressionStatementNode && expressionStatementNode.expression) {
      const expression = expressionStatementNode.expression;
      this.expression(expression, 'float');
    }
  };

  expression = (expression: any, valType: string, isLeft?: boolean) => {
    switch (expression.type) {
      case 'RangeLiteral':
        this.rangeLiteral(expression.value);
        break;
      case 'RowLiteral':
        this.rowLiteral(expression.value);
        break;
      case 'ColumnLiteral':
        this.columnLiteral(expression.value);
        break;
      case 'BooleanLiteral':
        this.booleanLiteral(expression.value);
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
        this.identifier(expression);
        break;
      case 'AssignmentExpression':
        this.assignmentExpression(expression);
        break;
      case 'BinaryExpression':
        this.binaryExpression(expression, valType);
        break;
      case 'LogicalExpression': {
        this.logicalExpression(expression, valType);
        break;
      }
      case 'MemberExpression': {
        this.memberExpression(expression);
        break;
      }
      case 'CallExpression': {
        this.callExpression(expression);
        if (!isLeft) {
          this.codeScript += `;`;
        }
        break;
      }
      case 'UnaryExpression':
        this.unaryExpression(expression, valType);
        break;
      case 'FilterStatement':
        this.filterStatement(expression, true);
        break;
    }
    return true;
  };

  rangeLiteral = (value: any) => {
    this.codeScript += `"${value || ''}"`;
  };
  rowLiteral = (value: any) => {
    this.codeScript += `"${value || ''}"`;
  };
  columnLiteral = (value: any) => {
    this.codeScript += `"${value || ''}"`;
  };
  booleanLiteral = (value: any) => {
    this.codeScript += `${value ? 'true' : 'false'}`;
  };

  assignmentExpression = (expression: any) => {
    if (expression.operator === '=') {
      if (expression.left && expression.left.type === 'MemberExpression') {
        this.memberExpression(expression.left);
        this.codeScript += ' = ';
        this.expression(expression.right, '');
        this.codeScript += ';';
      } else if (expression.left && expression.left.type === 'Identifier') {
        let valType = '';
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
        if (expression.right.type === 'Identifier') {
          const variableIndex = this.localVarablesList.indexOf(
            expression.right.name
          );
          if (variableIndex >= 0) {
            this.codeScript += `structuredClone(local_${variableIndex})`;
          } else {
            this.expression(expression.right, valType);
          }
        } else {
          this.expression(expression.right, valType);
        }
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

        this.expression(expression.right, valType);

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
  };

  identifier = (expression: any) => {
    if (expression.name) {
      if (this.constantDefinitions[expression.name] !== undefined) {
        this.codeScript += `${this.constantDefinitions[expression.name]}`;
      } else if (this.localVarablesList.indexOf(expression.name) >= 0) {
        const variableIndex = this.localVarablesList.indexOf(expression.name);
        if (variableIndex >= 0) {
          this.codeScript += `local_${variableIndex}`;
        }
      } else {
        this.payloadProperties.push(expression.name);
        this.codeScript += `payload.${expression.name}`;
      }
    } else {
      throw new Error(`Identifier without variable found in Expression`);
    }
  };

  logicalExpression = (expression: any, valType: string) => {
    this.expression(expression.left, valType, true);

    let useValType = 'float';
    const outputType =
      expression.left?.outputType ?? expression.right?.outputType ?? '';
    if (outputType === 'integer') {
      useValType = 'integer';
    }

    if (expression.operator === '&&' || expression.operator === 'and') {
      this.codeScript += ` && `;
    } else if (expression.operator === '||' || expression.operator === 'or') {
      this.codeScript += ` || `;
    }

    this.expression(expression.right, valType);

    // TODO : xor .. shl .. shr .. rot etc..
  };

  unaryExpressionAsString = (expression: any, valType: string) => {
    if (expression.operator === '-') {
      if (expression.argument && expression.argument.type === 'NumberLiteral') {
        if (valType === 'integer') {
          return `-${expression.argument.value | 0}`;
        } else {
          return `-${expression.argument.value}`;
        }
      }
    } else {
      throw new Error(
        `UnaryExpression "${expression.operator}" cannot be handled`
      );
    }
  };

  unaryExpression = (expression: any, valType: string) => {
    if (expression.operator === '-') {
      if (expression.argument && expression.argument.type === 'NumberLiteral') {
        if (valType === 'integer') {
          this.codeScript += `-${expression.argument.value | 0}`;
        } else {
          this.codeScript += `-${expression.argument.value}`;
        }
      }
    } else {
      throw new Error(
        `UnaryExpression "${expression.operator}" cannot be handled`
      );
    }
  };

  binaryExpressionAsString = (expression: any, valType: string) => {
    const oldCodeScript = this.codeScript;
    this.codeScript = '';
    this.binaryExpression(expression, valType);
    const resultScript = this.codeScript;
    this.codeScript = oldCodeScript;
    return resultScript;
  };

  binaryExpression = (expression: any, valType: string) => {
    this.expression(expression.left, valType, true);

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

    this.expression(expression.right, valType);
  };

  memberExpression = (expressionNode: any) => {
    if (
      expressionNode.object &&
      expressionNode.object.type === 'MemberExpression'
    ) {
      this.expression(expressionNode.object, '');
      if (
        expressionNode.property &&
        expressionNode.property.type === 'UnaryExpression'
      ) {
        this.codeScript += this.unaryExpression(expressionNode.property, '');
      } else if (
        expressionNode.property &&
        expressionNode.property.type === 'Identifier'
      ) {
        this.codeScript += `.${expressionNode.property.name}`;
      } else if (
        expressionNode.property &&
        expressionNode.property.type === 'BinaryExpression'
      ) {
        this.codeScript += this.binaryExpression(expressionNode.property, '');
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
        expressionNode.property.type === 'BinaryExpression'
      ) {
        const localVariableIndex = this.localVarablesList.indexOf(
          expressionNode.object.name
        );
        if (localVariableIndex >= 0) {
          const variableType = this.localVarablesTypeList[localVariableIndex];
          if (variableType === 'array') {
            this.codeScript += `local_${localVariableIndex}.at(${this.binaryExpressionAsString(
              expressionNode.property,
              ''
            )})`;
          } else {
            throw new Error(
              'UnaryExpression not supported for non array types'
            );
          }
        } else {
          // TODO : add to payloadProperties for payload validation
          const helper = `${this.binaryExpressionAsString(
            expressionNode.property,
            ''
          )}`;
          this.codeScript += `(Array.isArray(payload.${expressionNode.object.name}) ? payload.${expressionNode.object.name}.at(${helper}) : payload.${expressionNode.object.name}[${helper}])`;
        }
      } else if (
        expressionNode.property &&
        expressionNode.property.type === 'UnaryExpression'
      ) {
        const localVariableIndex = this.localVarablesList.indexOf(
          expressionNode.object.name
        );
        if (localVariableIndex >= 0) {
          const variableType = this.localVarablesTypeList[localVariableIndex];
          if (variableType === 'array') {
            this.codeScript += `local_${localVariableIndex}.at(${this.unaryExpressionAsString(
              expressionNode.property,
              ''
            )})`;
          } else {
            throw new Error(
              'UnaryExpression not supported for non array types'
            );
          }
        } else {
          // TODO : add to payloadProperties for payload validation
          const helper = `${this.unaryExpressionAsString(
            expressionNode.property,
            ''
          )}`;
          this.codeScript += `(Array.isArray(payload.${expressionNode.object.name}) ? payload.${expressionNode.object.name}.at(${helper}) : payload.${expressionNode.object.name}[${helper}])`;
        }
      } else if (
        expressionNode.property &&
        expressionNode.property.type === 'Identifier'
      ) {
        const localVariableIndex = this.localVarablesList.indexOf(
          expressionNode.object.name
        );
        if (localVariableIndex >= 0) {
          const variableType = this.localVarablesTypeList[localVariableIndex];
          if (variableType === 'array') {
            const propertyNameVariableIndex = this.localVarablesList.indexOf(
              expressionNode.property.name
            );
            if (propertyNameVariableIndex >= 0) {
              this.codeScript += `local_${localVariableIndex}.at(local_${propertyNameVariableIndex})`;
            } else {
              this.codeScript += `local_${localVariableIndex}.${expressionNode.property.name}`;
            }
          } else {
            this.codeScript += `local_${localVariableIndex}.${expressionNode.property.name}`;
          }
        } else {
          this.payloadProperties.push(
            `${expressionNode.object.name}.${expressionNode.property.name}`
          );
          if (expressionNode.property.name === 'length') {
            this.codeScript += `payload.${expressionNode.object.name}.${expressionNode.property.name}`;
          } else {
            this.codeScript += `(Array.isArray(payload.${expressionNode.object.name}) ? payload.${expressionNode.object.name}.at(payload.${expressionNode.property.name}) : payload.${expressionNode.object.name}[payload.${expressionNode.property.name}])`;
          }
        }
      } else if (
        expressionNode.property &&
        expressionNode.property.type === 'NumberLiteral'
      ) {
        const localVariableIndex = this.localVarablesList.indexOf(
          expressionNode.object.name
        );
        if (localVariableIndex >= 0) {
          this.codeScript += `local_${localVariableIndex}[${expressionNode.property.value}]`;
        } else {
          // TODO : fix this to work with arrays..

          this.payloadProperties.push(
            `${expressionNode.object.name}.${expressionNode.property.name}`
          );
          this.codeScript += `payload.${expressionNode.object.name}[${expressionNode.property.value}]`;
        }
      } else {
        throw new Error(
          `Unsupported property "${expressionNode.property.type}" in MemberExpression`
        );
      }
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
            } else if (
              (variableDeclaration.variableType === 'array' &&
                !variableDeclaration.init) ||
              (variableDeclaration.init &&
                variableDeclaration.init.type === 'array')
            ) {
              this.localVarablesTypeList.push('array');
              this.localVarablesList.push(variableDeclaration.id.name);
              console.log('array initializer found', variableDeclaration.init);
              this.codeScript += `let local_${
                this.localVarablesList.length - 1
              } = [`;
              if (variableDeclaration.init) {
                variableDeclaration.init.elements.forEach(
                  (element: any, index: number) => {
                    this.expression(element, '');
                    if (index < variableDeclaration.init.elements.length - 1) {
                      this.codeScript += `,`;
                    }
                  }
                );
              }

              this.codeScript += `];`;
            } else if (
              variableDeclaration.init &&
              variableDeclaration.init.type === 'Markup' &&
              variableDeclaration.init.markupTree
            ) {
              this.localVarablesTypeList.push('markup');
              this.localVarablesList.push(variableDeclaration.id.name);

              this.codeScript += `let local_${
                this.localVarablesList.length - 1
              } =`;
              if (this.markupCompiler) {
                this.codeScript += `${this.markupCompiler(
                  variableDeclaration.init.markupTree
                )};`;
              }
            } else {
              console.log(variableDeclaration.init);
              throw new Error('Variable initializer can only be a number.');
            }
          }
        }
      });
    }
  };

  returnStatement = (returnStatementNode: any) => {
    if (returnStatementNode.markupTree && this.markupCompiler) {
      this.codeScript += `${this.markupCompiler(
        returnStatementNode.markupTree
      )};`;
    } else if (returnStatementNode.argument) {
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
      if (expressionNode.callee?.type === 'MemberExpression') {
        this.memberExpression(expressionNode.callee);
        this.codeScript += `(`;
      } else {
        this.codeScript += `${expressionNode.callee.name}(`;
      }
    }
    expressionNode.arguments.forEach(
      (argumentExpression: any, index: number) => {
        let paramType = 'float';

        if (functionDeclaration.length > 0) {
          if (index < functionDeclaration[0].localVarablesTypeList.length) {
            paramType = functionDeclaration[0].localVarablesTypeList[index];
          }
        }
        this.expression(argumentExpression, paramType);
        if (index < expressionNode.arguments.length - 1) {
          this.codeScript += `,`;
        }
      }
    );

    if (expressionNode.callee?.type === 'MemberExpression') {
      //this.memberExpression(expressionNode.callee);
    } else {
      const functionIndex = this.functionList.indexOf(
        expressionNode.callee.name
      );

      if (functionIndex < 0 && !customFunction) {
        throw new Error(`function ${expressionNode.callee.name} not found`);
      }
    }

    this.codeScript += `)`;

    return true;
  };

  forEachStatement = (forEachStatementNode: any) => {
    if (
      forEachStatementNode.identifier &&
      forEachStatementNode.listIdentifier &&
      forEachStatementNode.body
    ) {
      const stackLocalVarablesList: string[] = [...this.localVarablesList];
      const stackLocalVarablesTypeList: string[] = [
        ...this.localVarablesTypeList,
      ];

      this.localVarablesList.push(forEachStatementNode.identifier.name);
      this.localVarablesTypeList.push('integer');
      const listIdentifierLocalVariableindex = this.localVarablesList.indexOf(
        forEachStatementNode.listIdentifier.name
      );
      this.codeScript += `for (let local_${
        this.localVarablesList.length - 1
      } of local_${listIdentifierLocalVariableindex}) {`;
      this.statement(forEachStatementNode.body);

      this.codeScript += `};`;

      this.localVarablesList = stackLocalVarablesList;
      this.localVarablesTypeList = stackLocalVarablesTypeList;
    }
  };

  mapStatement = (mapStatementNode: any) => {
    if (
      mapStatementNode.identifier &&
      mapStatementNode.listIdentifier &&
      mapStatementNode.body &&
      mapStatementNode.body.body
    ) {
      const stackLocalVarablesList: string[] = [...this.localVarablesList];
      const stackLocalVarablesTypeList: string[] = [
        ...this.localVarablesTypeList,
      ];

      this.localVarablesList.push(mapStatementNode.identifier.name);
      this.localVarablesTypeList.push('integer');
      const listIdentifierLocalVariableindex = this.localVarablesList.indexOf(
        mapStatementNode.listIdentifier.name
      );
      this.codeScript += `local_${listIdentifierLocalVariableindex} = local_${listIdentifierLocalVariableindex}.map((local_${
        this.localVarablesList.length - 1
      }) => {`;
      //this.statement(mapStatementNode.body);

      mapStatementNode.body.body.forEach(
        (statementNode: any, index: number) => {
          if (
            index === mapStatementNode.body.body.length - 1 &&
            statementNode.type === 'ExpressionStatement'
          ) {
            this.codeScript += 'return ';
          }
          this.statement(statementNode, true);
        }
      );

      this.codeScript += `});`;

      this.localVarablesList = stackLocalVarablesList;
      this.localVarablesTypeList = stackLocalVarablesTypeList;
    }
  };

  filterStatement = (mapStatementNode: any, isExpression?: boolean) => {
    if (
      mapStatementNode.identifier &&
      mapStatementNode.listIdentifier &&
      mapStatementNode.test
    ) {
      const stackLocalVarablesList: string[] = [...this.localVarablesList];
      const stackLocalVarablesTypeList: string[] = [
        ...this.localVarablesTypeList,
      ];

      this.localVarablesList.push(mapStatementNode.identifier.name);
      this.localVarablesTypeList.push('integer');
      const listIdentifierLocalVariableindex = this.localVarablesList.indexOf(
        mapStatementNode.listIdentifier.name
      );

      if (!isExpression) {
        this.codeScript += `local_${listIdentifierLocalVariableindex} = `;
      }

      this.codeScript += `local_${listIdentifierLocalVariableindex}.filter((local_${
        this.localVarablesList.length - 1
      }) => `;

      this.expression(mapStatementNode.test, '');

      this.codeScript += `)`;
      if (!isExpression) {
        this.codeScript += `;`;
      }

      this.localVarablesList = stackLocalVarablesList;
      this.localVarablesTypeList = stackLocalVarablesTypeList;
    }
  };
}
