var webpack = require('webpack');
var pkg = require('./package.json');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    //devtool :"#source-map",
    entry: {
        codebeautifier: __dirname + '/src/index.js'
    },
    output: {
        path: __dirname + '/lib',
        filename: "codebeautifier.js",
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        // css-loader 是处理css文件中的url
        // style-loader 将css插入到页面的style标签
        loaders: [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("css-loader")
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
            include: ['codebeautifier.js']
        }),
        new webpack.BannerPlugin('Author: harry.lang' +
            '\nVersion: ' + pkg.version +
            '\nDATE: ' + new Date().toLocaleString() +
            '\nDescription:' + pkg.description),
        new ExtractTextPlugin("[name].css?[hash]-[chunkhash]-[contenthash]-[name]", {
            disable: false,
            allChunks: true
        })
    ]
};
