var webpack = require('webpack');
require("babel-polyfill");

module.exports = {
    //devtool :"#source-map",
    entry: ['babel-polyfill', __dirname + '/src/index.js'],
    output: {
        path: __dirname + '/lib',
        filename: "codebeautifier.js",
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        // https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.SourceMapDevToolPlugin({
            filename: '[file].map',
            //include: ['codebeautifier.js']
        })
        //new webpack.BannerPlugin('/**/')
    ]
};
