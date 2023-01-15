import {
  IASTConstantNode,
  IASTFunctionNode,
  IASTReturnNode,
  IASTTree,
  IFunctionParameter,
} from '../interfaces/ast';
import { VariableType } from '../interfaces/variable-type';
import { Body } from './constants';
import { Tokenizer } from './tokenizer';

export class Parser {
  _string = '';
  _tokenizer: Tokenizer | null = null;
  _lookahead: any = null;

  _currentFunction: string = Body;

  constructor() {
    this._string = '';
    this._tokenizer = new Tokenizer();
  }

  parse = (expression: string): IASTTree | false => {
    this._string = expression;
    this._isEndOfCode = false;

    if (this._tokenizer) {
      this._tokenizer.init(this._string);
      this._lookahead = this._tokenizer.getNextToken();
      const program = this.Program();
      return program;
    }
    return false;
  };

  Program = (): IASTTree => {
    return {
      type: 'Program',
      body: this.StatementList(),
    };
  };

  StatementList = (stopLookahead: any = null) => {
    const statementList = [this.Statement()];
    while (this._lookahead != null && this._lookahead.type !== stopLookahead) {
      const statement = this.Statement();
      if (statement) {
        statementList.push(statement);
      }
    }
    return statementList;
  };

  Statement = () => {
    if (!this._lookahead) {
      return null;
    }

    switch (this._lookahead.type) {
      case ';':
        return this.EmptyStatement();
      case '{':
        return this.BlockStatement();
      case 'let':
        return this.VariableStatement();
      case 'function':
        return this.FunctionDeclaration();
      case 'return':
        return this.ReturnStatement();

      case 'constant':
        return this.ConstantStatement();
      case 'if':
        return this.IfStatement();
      case 'while':
      case 'do':
      case 'for':
        return this.IterationStatement();
      case 'forEach':
        return this.ForEachStatement();
      case 'map':
        return this.MapStatement();
      case 'filter':
        return this.FilterStatement();
      default:
        return this.ExpressionStatement();
    }
  };

  FunctionDeclaration = (): IASTFunctionNode => {
    let functionReturnType: VariableType = 'float';
    this._eat('function');
    const name = this.Identifier();
    //this._currentFunction = name.name;
    this._eat('(');
    const params =
      this._lookahead.type !== ')' ? this.FormalDeclarationList() : [];
    this._eat(')');

    if (this._lookahead.type === ':') {
      this._eat(':');
      if (this._lookahead.type === 'integer') {
        this._eat('integer');
        functionReturnType = 'integer';
      } else if (this._lookahead.type === 'float') {
        this._eat('float');
        functionReturnType = 'float';
      } else if (this._lookahead.type === 'string_type') {
        this._eat('string_type');
        functionReturnType = 'string';
      } else if (this._lookahead.type === 'range_type') {
        this._eat('range_type');
        functionReturnType = 'range';
      } else if (this._lookahead.type === 'boolean') {
        this._eat('boolean');
        functionReturnType = 'boolean';
      } else {
        throw new SyntaxError(
          `Invalid function return type for ${name} : ${this._lookahead.type}`
        );
      }
    }
    const body = this.BlockStatement();

    this._currentFunction = Body;

    return {
      type: 'FunctionDeclaration',
      name,
      params,
      body,
      functionType: functionReturnType,
    };
  };

  FormalDeclarationList = () => {
    const params: IFunctionParameter[] = [];
    do {
      const identifier = this.Identifier();
      let valType: VariableType = 'float';
      if (this._lookahead.type === ':') {
        this._eat(':');
        if (this._lookahead.type === 'integer') {
          this._eat('integer');
          valType = 'integer';
        } else if (this._lookahead.type === 'float') {
          this._eat('float');
          valType = 'float';
        } else if (this._lookahead.type === 'string_type') {
          this._eat('string_type');
          valType = 'string';
        } else if (this._lookahead.type === 'range') {
          this._eat('range');
          valType = 'range';
        } else if (this._lookahead.type === 'boolean') {
          this._eat('boolean');
          valType = 'boolean';
        }
      }

      const functionParameter: IFunctionParameter = {
        identifier: identifier,
        parameterType: valType,
      };
      params.push(functionParameter);
    } while (this._lookahead.type === ',' && this._eat(','));
    return params;
  };

  ReturnStatement = (): IASTReturnNode => {
    if (this._lookahead.type === 'return') {
      this._eat('return');
    }
    const argument = this._lookahead.type !== ';' ? this.Expression() : null;
    this._eat(';');
    return {
      type: 'ReturnStatement',
      argument,
      //returnType: getValtype(valType),
    };
  };

  ConstantStatement = (): IASTConstantNode => {
    this._eat('constant');
    const id = this.Identifier();
    this._eat('SIMPLE_ASSIGN');
    const value = this.NumberLiteral();
    this._eat(';');

    return {
      type: 'ConstantStatement',
      id,
      value,
    };
  };

  IterationStatement = (): any => {
    switch (this._lookahead.type) {
      case 'while_i32':
        return this.WhileStatement();
      case 'while':
        return this.WhileStatement();
      case 'do':
        return this.DoWhileStatement();
      default:
        return null;
    }
  };

  WhileStatement = (): any => {
    this._eat('while');
    this._eat('(');
    const test = this.Expression();
    this._eat(')');
    const body = this.Statement();

    return {
      type: 'WhileStatement',
      test,
      body,
    };
  };

  DoWhileStatement = (): any => {
    this._eat('do');
    const body = this.Statement();
    this._eat('while');
    this._eat('(');
    const test = this.Expression();
    this._eat(')');

    this._eat(';');

    return {
      type: 'DoWhileStatement',
      body,
      test,
    };
  };

  ForEachStatement = (): any => {
    this._eat('forEach');
    const identifier = this.Identifier();
    this._eat('in');
    const listIdentifier = this.Identifier();
    const body = this.Statement();
    return {
      type: 'ForEachStatement',
      identifier,
      listIdentifier,
      body,
    };
  };

  MapStatement = (): any => {
    this._eat('map');
    const identifier = this.Identifier();
    this._eat('in');
    const listIdentifier = this.Identifier();
    this._eat('to');
    const body = this.Statement();
    return {
      type: 'MapStatement',
      identifier,
      listIdentifier,
      body,
    };
  };

  FilterStatement = (): any => {
    this._eat('filter');
    const identifier = this.Identifier();
    this._eat('in');
    const listIdentifier = this.Identifier();
    this._eat('where');
    const test = this.Expression();
    return {
      type: 'FilterStatement',
      identifier,
      listIdentifier,
      test,
    };
  };

  IfStatement = (): any => {
    this._eat('if');
    this._eat('(');
    const test = this.Expression();
    this._eat(')');
    const consequent = this.Statement();
    const alternate =
      this._lookahead != null && this._lookahead.type === 'else'
        ? this._eat('else') && this.Statement()
        : null;
    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
    };
  };

  VariableStatement = (): any => {
    this._eat('let');
    const declarations = this.VariableDeclarationsList();
    this._eat(';');
    return {
      type: 'VariableStatement',
      declarations,
    };
  };

  VariableDeclarationsList = (): any => {
    const declarations: any[] = [];
    do {
      declarations.push(this.VariableDeclaration());
    } while (this._lookahead.type === ',' && this._eat(','));
    return declarations;
  };

  VariableDeclaration = (): any => {
    let variableType = '';
    let variableSubType = '';
    const id = this.Identifier();
    if (this._lookahead.type === ':') {
      this._eat(':');
      // see VariableStatement

      if (this._lookahead.type === 'integer') {
        this._eat(this._lookahead.type);
        variableType = 'integer';
      } else if (this._lookahead.type === 'float') {
        this._eat(this._lookahead.type);
        variableType = 'float';
      } else if (this._lookahead.type === 'string_type') {
        this._eat(this._lookahead.type);
        variableType = 'string';
      } else if (this._lookahead.type === 'boolean') {
        this._eat(this._lookahead.type);
        variableType = 'boolean';
      } else if (this._lookahead.type === 'range_type') {
        this._eat(this._lookahead.type);
        variableType = 'range';
      } else if (this._lookahead.type === '[') {
        this._eat(this._lookahead.type);
        if (this._lookahead.type === 'integer') {
          variableSubType = this._lookahead.value;
          this._eat(this._lookahead.type);
        }
        if (this._lookahead.type === ']') {
          this._eat(this._lookahead.type);
          variableType = 'array';
        } else {
          throw new Error('Expected ]');
        }
        // token.value.slice(1, -1),
      }

      if (this._lookahead.type === 'SIMPLE_ASSIGN') {
        this._eat('SIMPLE_ASSIGN');
        if (this._lookahead.type === 'new') {
          this._eat('new');
          //
          let size = 1;
          if (this._lookahead.type === 'size') {
            this._eat('size');
            const value = this.NumberLiteral();
            size = value.value;
          }
          if (this._lookahead.type === ';') {
            this._eat(';');

            return {
              type: 'VariableDeclaration',
              id,
              init: {
                type: 'NewMemoryVariable',
                variableType: variableType,
                size: size,
              },
            };
          } else {
            // throw ..
          }
        } else {
          const init = this.VariableInitializer();

          return {
            type: 'VariableDeclaration',
            id,
            init,
          };
        }
      }
    }
    const init =
      this._lookahead.type !== ';' && this._lookahead.type !== ','
        ? this.VariableInitializer(true)
        : null;

    return {
      type: 'VariableDeclaration',
      id,
      init,
      variableType,
      variableSubType,
    };
  };

  VariableInitializer = (eatSimpleAssign?: boolean) => {
    if (eatSimpleAssign) {
      this._eat('SIMPLE_ASSIGN');
    }
    if (this._lookahead.type === '[') {
      this._eat('[');
      const elements = [];
      let variableType = '';
      let loop = 0;
      while (this._lookahead && this._lookahead.type !== ']') {
        const expression = this.Expression();
        if (loop === 0) {
          variableType = expression.type;
        } else {
          if (variableType !== expression.type) {
            throw new Error('Variable type mismatch in variable initializer');
          }
        }
        elements.push(expression);
        if (this._lookahead?.type === ',') {
          this._eat(',');
        }
        loop++;
      }
      this._eat(']');
      return { type: 'array', elements };
    } else {
      return this.AssignmentExpression();
    }
  };

  EmptyStatement = () => {
    this._eat(';');
    return {
      type: 'EmptyStatement',
    };
  };

  BlockStatement = (): any => {
    this._eat('{');
    const body = this._lookahead.type !== '}' ? this.StatementList('}') : [];
    this._eat('}');
    return {
      type: 'BlockStatement',
      body,
    };
  };

  ExpressionStatement = (): any => {
    const expression = this.Expression();
    if (!this._isEndOfCode) {
      this._eat(';', true);
    } else {
      this._lookahead = null;
    }
    return {
      type: 'ExpressionStatement',
      expression,
    };
  };

  Expression = () => {
    return this.AssignmentExpression();
  };

  AssignmentExpression = (): any => {
    const left = this.LogicalORExpression();
    if (
      this._lookahead == null ||
      !this._isAssignmentOperator(this._lookahead.type)
    ) {
      return left;
    }
    return {
      type: 'AssignmentExpression',
      operator: this.AssignmentOperator().value,
      left: this._checkValidAssignmentTarget(left),
      right: this.AssignmentExpression(),
    };
  };

  EqualityExpression = () => {
    return this._binaryExpression(
      'RelationExpression',
      'EQUALITY_OPERATOR',
      'integer'
    );
  };

  RelationExpression = () => {
    return this._binaryExpression(
      'AdditiveExpression',
      'RELATIONAL_OPERATOR',
      'integer'
    );
  };

  Identifier = () => {
    const name = this._eat('IDENTIFIER').value;
    return {
      type: 'Identifier',
      name,
    };
  };

  _isAssignmentOperator = (tokenType: string): any => {
    return tokenType === 'SIMPLE_ASSIGN' || tokenType === 'COMPLEX_ASSIGN';
  };

  _checkValidAssignmentTarget = (node: any): any => {
    if (node.type === 'Identifier' || node.type === 'MemberExpression') {
      //this._currentFunction === Body
      return node;
    }
    throw new SyntaxError(`Invalid left-hand side in assignment expression`);
  };

  AssignmentOperator = () => {
    if (this._lookahead.type === 'SIMPLE_ASSIGN') {
      return this._eat('SIMPLE_ASSIGN');
    }
    return this._eat('COMPLEX_ASSIGN');
  };

  LogicalORExpression = () => {
    return this._logicalExpression('LogicalORKEYWORDExpression', 'LOGICAL_OR');
  };

  LogicalORKEYWORDExpression = () => {
    return this._logicalExpression(
      'LogicalANDExpression',
      'LOGICAL_OR_KEYWORD'
    );
  };

  LogicalANDExpression = () => {
    return this._logicalExpression(
      'LogicalANDKEYWORDExpression',
      'LOGICAL_AND'
    );
  };

  LogicalANDKEYWORDExpression = () => {
    return this._logicalExpression(
      'LogicalXORExpression',
      'LOGICAL_AND_KEYWORD'
    );
  };

  LogicalXORExpression = () => {
    return this._logicalExpression(
      'LogicalSHIFTRightExpression',
      'LOGICAL_XOR'
    );
  };

  LogicalSHIFTRightExpression = () => {
    return this._logicalExpression(
      'LogicalUNSIGNEDSHIFTRightExpression',
      'LOGICAL_SIGNEDSHIFTRIGHT'
    );
  };

  LogicalUNSIGNEDSHIFTRightExpression = () => {
    return this._logicalExpression(
      'EqualityExpression',
      'LOGICAL_UNSIGNEDSHIFTRIGHT'
    );
  };

  _logicalExpression = (builderName: string, operatorToken: string) => {
    let left = (this as any)[builderName]();
    while (this._lookahead != null && this._lookahead.type === operatorToken) {
      const operator = this._eat(operatorToken).value;
      const right = (this as any)[builderName]();
      left = {
        type: 'LogicalExpression',
        operator,
        left,
        right,
      };
    }
    return left;
  };

  AdditiveExpression = () => {
    return this._binaryExpression(
      'MultiplicativeExpression',
      'ADDITIVE_OPERATOR'
    );
  };

  MultiplicativeExpression = () => {
    return this._binaryExpression('UnaryExpression', 'MULTIPLICATIVE_OPERATOR');
  };

  _binaryExpression = (
    builderName: string,
    operatorToken: string,
    outputType?: string
  ) => {
    let left: any = (this as any)[builderName]();
    while (this._lookahead != null && this._lookahead.type === operatorToken) {
      const operator = this._eat(operatorToken).value;
      const right = (this as any)[builderName]();

      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        outputType: outputType || '',
      };
    }
    return left;
  };

  UnaryExpression = (): any => {
    let operator;
    switch (this._lookahead.type) {
      case 'ADDITIVE_OPERATOR':
        operator = this._eat('ADDITIVE_OPERATOR').value;
        break;
      case 'LOGICAL_NOT':
        operator = this._eat('LOGICAL_NOT').value;
        break;
    }
    if (operator != null) {
      return {
        type: 'UnaryExpression',
        operator,
        argument: this.UnaryExpression(),
      };
    }
    return this.LeftHandSideExpression();
  };

  LeftHandSideExpression = (): any => {
    if (this._lookahead != null && this._lookahead.type === 'filter') {
      return this.FilterStatement();
    }
    return this.CallMemberExpression();
  };

  CallMemberExpression = (): any => {
    const member = this.MemberExpression();

    if (this._lookahead != null && this._lookahead.type === '(') {
      return this._CallExpression(member);
    }

    return member;
  };

  _CallExpression = (callee: any) => {
    let callExpression = {
      type: 'CallExpression',
      callee,
      arguments: this.Arguments(),
    };

    if (this._lookahead !== null && this._lookahead.type === '(') {
      callExpression = this._CallExpression(callExpression);
    }

    return callExpression;
  };

  Arguments = () => {
    this._eat('(');

    const argumentList =
      this._lookahead.type !== ')' ? this.ArgumentList() : [];
    this._eat(')');
    return argumentList;
  };

  ArgumentList = () => {
    const argumentList: any[] = [];
    do {
      const expression = this.Expression();
      argumentList.push(expression);
    } while (this._lookahead?.type === ',' && this._eat(','));
    return argumentList;
  };

  MemberExpression = (fromCallerExpression?: boolean) => {
    let object = this.PrimaryExpression(fromCallerExpression);
    while (
      this._lookahead != null &&
      (this._lookahead.type === '.' || this._lookahead.type === '[')
    ) {
      if (this._lookahead != null && this._lookahead.type === '.') {
        this._eat('.');
        const property = this.Identifier();
        object = {
          type: 'MemberExpression',
          computed: false,
          object,
          property,
        };
      }

      if (this._lookahead != null && this._lookahead.type === '[') {
        this._eat('[');
        const property = this.Expression();
        this._eat(']');
        object = {
          type: 'MemberExpression',
          computed: true,
          object,
          property,
        };
      }
    }
    return object;
  };

  PrimaryExpression = (fromCallerExpression?: boolean) => {
    if (this._isLiteral(this._lookahead.type)) {
      return this.Literal();
    }
    switch (this._lookahead.type) {
      case '(':
        return this.ParenthesizedExpression();
      case 'IDENTIFIER': {
        const identifier = this.Identifier();
        return identifier;
      }
      default:
        return this.LeftHandSideExpression();
    }
  };

  _isLiteral = (tokenType: string) => {
    return (
      tokenType === 'payload' ||
      tokenType === 'StateMachine' ||
      tokenType === 'HEXNUMBER' ||
      tokenType === 'NUMBER' ||
      tokenType === 'STRING' ||
      tokenType === 'RANGE' ||
      tokenType === 'ROW' ||
      tokenType === 'COLUMN' ||
      tokenType === 'true' ||
      tokenType === 'false' ||
      tokenType === 'null'
    );
  };

  ParenthesizedExpression = () => {
    this._eat('(');
    const expression = this.Expression();
    this._eat(')');
    return expression;
  };

  Literal = () => {
    switch (this._lookahead.type) {
      case 'payload':
        return this.PayloadLiteral();
      case 'RANGE':
        return this.RangeLiteral();
      case 'ROW':
        return this.RowLiteral();
      case 'COLUMN':
        return this.ColumnLiteral();
      case 'HEXNUMBER':
        return this.HexNumberLiteral();
      case 'NUMBER':
        return this.NumberLiteral();
      case 'STRING':
        return this.StringLiteral();
      case 'true':
        return this.BooleanLiteral(true);
      case 'false':
        return this.BooleanLiteral(false);
      case 'null':
        return this.NullLiteral();
    }
    throw new SyntaxError(`Literal: unexpected literal production`);
  };

  PayloadLiteral = () => {
    this._eat('payload');
    return {
      type: 'PayloadLiteral',
    };
  };

  BooleanLiteral = (value: any) => {
    this._eat(value ? 'true' : 'false');
    return {
      type: 'BooleanLiteral',
      value,
    };
  };

  NullLiteral = () => {
    this._eat('null');
    return {
      type: 'NullLiteral',
      value: null,
    };
  };

  HexNumberLiteral = () => {
    const token = this._eat('HEXNUMBER');
    const numberString = token.value.substring(2);
    return {
      type: 'NumberLiteral',
      isBig: numberString.length >= 8,
      value: Number(parseInt(numberString, 16)),
    };
  };

  NumberLiteral = () => {
    const token = this._eat('NUMBER');
    return {
      type: 'NumberLiteral',
      value: Number(token.value),
      hasDecimals: token.value.indexOf('.') >= 0,
    };
  };

  RangeLiteral = () => {
    const token = this._eat('RANGE');
    return {
      type: 'RangeLiteral',
      value: token.value,
    };
  };

  RowLiteral = () => {
    const token = this._eat('ROW');
    return {
      type: 'RowLiteral',
      value: token.value,
    };
  };

  ColumnLiteral = () => {
    const token = this._eat('COLUMN');
    return {
      type: 'ColumnLiteral',
      value: token.value,
    };
  };

  StringLiteral = () => {
    const token = this._eat('STRING');
    return {
      type: 'StringLiteral',
      value: token.value.slice(1, -1),
    };
  };

  _isEndOfCode = false;
  _eat = (tokenType: string, ignoreIfEndOfCode = false) => {
    const token = this._lookahead;
    if (token === null) {
      throw new SyntaxError(
        `Unexpected end of input, expected: "${tokenType}".`
      );
    }
    if (token.type !== tokenType) {
      throw new SyntaxError(
        `Unexpected token: "${token.type}", expected: "${tokenType}".`
      );
    }
    if (this._tokenizer && !this._tokenizer.hasMoreTokens()) {
      this._isEndOfCode = true;
    }
    this._lookahead = this._tokenizer && this._tokenizer.getNextToken();
    if (this._tokenizer && !this._tokenizer.hasMoreTokens()) {
      this._isEndOfCode = true;
    }
    return token;
  };
}
