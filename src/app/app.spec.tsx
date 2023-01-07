import { render } from '@testing-library/react';

import App from './app';

Object.defineProperty(window, 'crypto', {
  value: { randomUUID: () => '1234' },
});

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);

    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(<App />);

    expect(getByText(/Expression compiler!/gi)).toBeTruthy();
  });
});
