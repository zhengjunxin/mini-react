const webpack = require('webpack')
const path = require('path')

const config = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [{
            test: /\.js$/,
            include: path.resolve(__dirname, 'src'),
            loader: 'babel-loader',
            query: {
                compact: true,
                presets: [['env', {
                    'targets': {
                        'chrome': 52
                    },
                    'modules': false
                }]]
            }
        }]
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(__dirname, './dist'),
    }
}

module.exports = config
