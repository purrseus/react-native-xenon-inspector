module.exports = {
  presets: [['module:react-native-builder-bob/babel-preset', { modules: 'commonjs' }]],
  plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
};
