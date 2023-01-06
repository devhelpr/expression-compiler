const Specifcation: any[] = [
  // white-space
  [/^\s+/, null],

  // comments
  [/^\/\/.*/, null],
  [/^\/\*[\s\S]*?\*\//, null],

  [/^\w+\d+:\w+\d+/, 'RANGE'],
  [/^\brow:\d+/, 'ROW'],
  [/^\bcolumn:\w+/, 'COLUMN'],

  // symbols , delimiters
  [/^;/, ';'],
  [/^:/, ':'],
  [/^\{/, '{'],
  [/^\}/, '}'],
  [/^\(/, '('],
  [/^\)/, ')'],
  [/^,/, ','],
  [/^\./, '.'],
  [/^\[/, '['],
  [/^\]/, ']'],

  // keywords
  [/^\bconstant\b/, 'constant'],
  [/^\blet\b/, 'let'],
  [/^\bnew\b/, 'new'],
  [/^\binteger\b/, 'integer'],
  [/^\blongint\b/, 'longint'],
  [/^\bfloat\b/, 'float'],
  [/^\range\b/, 'range_type'],
  [/^\bstring\b/, 'string_type'],
  [/^if\b/, 'if'],
  [/^\belse\b/, 'else'],
  [/^\btrue\b/, 'true'],
  [/^\bfalse\b/, 'false'],
  [/^\bnull\b/, 'null'],
  [/^\bwhile\b/, 'while'],
  [/^\bdo\b/, 'do'],
  [/^\bfor\b/, 'for'],
  [/^\bfunction\b/, 'function'],
  [/^\breturn\b/, 'return'],
  [/^\bpayload\b/, 'payload'],

  [/^and/, 'LOGICAL_AND_KEYWORD'],
  [/^or/, 'LOGICAL_OR_KEYWORD'],
  [/^xor/, 'LOGICAL_XOR'],

  // numbers
  [/^0[x][0-9a-fA-F]+/, 'HEXNUMBER'],
  [/^\d+\.?\d*/, 'NUMBER'],

  // identifiers
  [/^\w+/, 'IDENTIFIER'],

  // Eqauality operator == !=
  [/^[=!]=/, 'EQUALITY_OPERATOR'],

  // assign operators = += -= *= /=
  [/^=/, 'SIMPLE_ASSIGN'],
  [/^[*/+-]=/, 'COMPLEX_ASSIGN'],

  // operators + - * / > >= < <=
  [/^[+-]/, 'ADDITIVE_OPERATOR'],
  [/^[*/%]/, 'MULTIPLICATIVE_OPERATOR'],
  [/^[><]=?/, 'RELATIONAL_OPERATOR'],

  // logical operators (see also XOR as keyword, above)
  [/^&&/, 'LOGICAL_AND'],
  [/^\|\|/, 'LOGICAL_OR'],
  [/^!/, 'LOGICAL_NOT'],

  // shift/rotate operators (see also SHIFTR as keywords, above)

  // strings
  [/^"[^"]*"/, 'STRING'],
  [/^'[^']*'/, 'STRING'],
];

export interface IToken {
  type: string;
  value: string;
}

export class Tokenizer {
  private string = ';';
  private cursor = 0;

  init = (inputString: string) => {
    this.string = inputString;
    this.cursor = 0;
  };

  hasMoreTokens = () => {
    return this.cursor < this.string.length;
  };
  getNextToken = (): IToken | null => {
    if (!this.hasMoreTokens()) {
      return null;
    }
    const string = this.string.slice(this.cursor);

    for (const [regexp, tokenType] of Specifcation) {
      const tokenValue = this.match(regexp as RegExp, string);
      if (tokenValue == null) {
        continue;
      }
      if (tokenType == null) {
        return this.getNextToken();
      }
      return {
        type: tokenType,
        value: tokenValue,
      };
    }

    throw new SyntaxError(`Unexpected token: "${string[0]}"`);
  };

  private match = (regexp: RegExp, string: string) => {
    const matched = regexp.exec(string);
    if (matched == null) {
      return null;
    }
    this.cursor += matched[0].length;
    return matched[0];
  };
}
