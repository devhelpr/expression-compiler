/**
 * @vitest-environment jsdom
 */

import { render } from '@testing-library/react';
import { expect } from 'vitest';
import App from './app';

Object.defineProperty(window, 'crypto', {
  value: { randomUUID: () => '1234' },
});

let helper: any = undefined;
let helperFunction: any = undefined;
/*Object.defineProperty(window, 'bind_1234', {
  set: (test: any) => {
    helper = test;
  },
  get: () => helper,
});
*/

(window as any)['bind_1234'] = (test: any) => {
  if (test) {
    helper = test;
  }
  return helper;
};

(window as any)['function_1234'] = (test: any) => {
  if (test) {
    helperFunction = test;
  }
  return helperFunction;
};

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);

    expect(baseElement).toBeTruthy();
  });

  it('should render Expression compiler', () => {
    const { getByText } = render(<App />);

    expect(getByText(/Expression compiler!/gi)).toBeTruthy();
  });
});
