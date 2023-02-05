import { Nullable } from 'vitest';
import { VariableType } from './variable-type';

export interface IASTNode {
  type: string;
}
export interface IASTBlockNode extends IASTNode {
  body: IASTNode[];
}
export interface IASTIdentifierNode extends IASTNode {
  name: string;
}

export interface IASTBinaryExpressionNode extends IASTNode {
  outputType: string;
  operator: string;
  left: IASTNode;
  right: IASTNode;
}
export interface IASTLogicalExpressionNode extends IASTNode {
  operator: string;
  left: IASTNode;
  right: IASTNode;
}

export interface IASTAssignmentExpressionNode extends IASTNode {
  operator: string;
  left: IASTNode;
  right: IASTNode;
}

export interface IASTExpressionNode extends IASTNode {
  expression: IASTNode;
}

export interface IASTReturnNode extends IASTNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  argument: any;
}

export interface IASTValueNode extends IASTNode {
  value: number;
  hasDecimals: boolean;
}

export interface IASTConstantNode extends IASTNode {
  id: IASTIdentifierNode;
  value: IASTValueNode;
}

export interface IASTFunctionNode extends IASTNode {
  name: IASTNode;
  params: IFunctionParameter[];
  body: IASTTree;
  functionType: VariableType;
}

export interface IASTVariableDeclarationNode extends IASTNode {
  id: IASTIdentifierNode;
  init:
    | IASTAssignmentExpressionNode
    | { type: string; elements: IASTAssignmentExpressionNode[] }
    | null;
  variableType?: string;
  variableSubType?: string;
}

export interface IASTVariableStatementNode extends IASTNode {
  declarations: IASTVariableDeclarationNode[];
}

export interface IASTIfStatementNode extends IASTNode {
  test: IASTAssignmentExpressionNode;
  consequent: IASTNode | null;
  alternate: IASTNode | null;
}

export interface IASTFilterStatementNode extends IASTNode {
  identifier: IASTIdentifierNode;
  listIdentifier: IASTIdentifierNode;
  test: IASTAssignmentExpressionNode;
}

export interface IASTMapStatementNode extends IASTNode {
  identifier: IASTIdentifierNode;
  listIdentifier: IASTIdentifierNode;
  body: IASTNode | null;
}
export interface IASTForEachStatementNode extends IASTNode {
  identifier: IASTIdentifierNode;
  listIdentifier: IASTIdentifierNode;
  body: IASTNode | null;
}
export interface IASTWhileStatementNode extends IASTNode {
  test: IASTAssignmentExpressionNode;
  body: IASTNode | null;
}

export interface IASTTree {
  type: string;
  body: IASTNode[];
}
export interface IFunctionParameter {
  identifier: IASTIdentifierNode;
  parameterType: string;
}
