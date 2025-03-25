module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    ['babel-plugin-transform-remove-imports', { 'test': '\\.(css|sass|scss)$' }],
  ],
}; 