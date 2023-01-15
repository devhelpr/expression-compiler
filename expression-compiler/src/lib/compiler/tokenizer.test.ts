import { Tokenizer } from './tokenizer';

describe('tokenizer', () => {
  test('should tokenizer run correct list of tokens', () => {
    const tokenizer = new Tokenizer();
    tokenizer.init(`"te;st";`);

    let token = tokenizer.getNextToken();
    expect(token).toBeDefined();
    if (token) {
      expect(token.type).toBe('STRING');
    }

    token = tokenizer.getNextToken();
    expect(token).toBeDefined();
    if (token) {
      expect(token.type).toBe(';');
    }

    expect(tokenizer.hasMoreTokens()).toBe(false);
  });
});
