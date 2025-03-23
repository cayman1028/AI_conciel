import '@testing-library/jest-dom';

// モックスクロール関数
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: jest.fn()
});
