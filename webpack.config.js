const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.webpack.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'vector.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'Vector',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  externals: {
    // If you have peer dependencies, you can exclude them here
    // For example, if you're building a React component library, you might exclude React itself:
    // 'react': 'React',
    // 'react-dom': 'ReactDOM'
  }
};
