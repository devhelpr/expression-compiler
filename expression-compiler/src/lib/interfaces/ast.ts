import { VariableType } from './variable-type';

export interface IASTNode {
  type: string;
}

export interface IASTIdentifierNode extends IASTNode {
  name: string;
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
export interface IASTTree {
  type: string;
  body: IASTNode[];
}
export interface IFunctionParameter {
  identifier: IASTIdentifierNode;
  parameterType: string;
}
