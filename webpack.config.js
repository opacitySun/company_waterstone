var webpack = require('webpack');
var path = require('path');

var stylishReporter = require('jshint-loader-reporter')('stylish');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var cssExtractor = new ExtractTextPlugin(1, './styles/[name].bundle.[chunkhash:8].css');

var env = require('./ENV').env;
var conf = require('./js/conf.json');

var vm  = this;
vm.pluginsProductAddition = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
            angular:true
        },
        mangle:false
    })
];
vm.imageLoaderConfig = {
    dev: [
        'file?name=images/[name].[ext]'
    ],
    product: [
        'file?hash=sha512&digest=hex&name=images/[hash].[ext]',
        'image-webpack?bypassOnDebug=true&optimizationLevel=7&interlaced=false'
    ]
};
vm.HtmlWebpackPluginConfig = {
    dev: {
        filename: 'index.html',
        template: path.resolve(__dirname, 'templates/index.html'),
        inject: true
    },
    product: {
        filename: 'index.html',
        template: path.resolve(__dirname, 'templates/index.html'),
        inject: true,
        hash: true,
        cache: true,
        showErrors: true,
        minify:{    //压缩HTML文件
            removeComments:true,    //移除HTML中的注释
            collapseWhitespace:true    //删除空白符与换行符
        }
    }
};
vm.commonsLength = conf.commons.length;
vm.entryConfig = {
    app: './js/app.js',
    main: './resource/styles/main.css.js'
};
vm.CommonsChunkNames = [];
if(vm.commonsLength > 15){
    var commonsNum = Math.ceil(vm.commonsLength/15);
    for(var i=0;i<commonsNum;i++){
        if((i+1) < commonsNum){
            vm.entryConfig['commons'+i] = conf.commons.slice(15*i,15*(i+1));
        }else{
            vm.entryConfig['commons'+i] = conf.commons.slice(15*i,vm.commonsLength-1);
        }
        vm.CommonsChunkNames.push('commons'+i);
    }
}

var webpackConfig = {
    context: __dirname,
    entry: vm.entryConfig,
    output: {
        path: path.resolve(__dirname, 'www'),
        filename: '[name].bundle.[chunkhash:8].js',
        publicPath: '/'
    },
    resolve: {
        alias: {
            //TODO: when dependencies have require, coder can add alias here.
        }
    },
    externals: {
        './js/dependencies/atmosphere.js': 'window.atmosphere'
    },
    plugins: [
        new CleanWebpackPlugin(['www']),
        new webpack.optimize.CommonsChunkPlugin({
            name:vm.CommonsChunkNames, /*chunk name*/
            //filename:'commons.[chunkhash:8].js',
            minChunks:Infinity
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            moment: 'moment',
            CryptoJS: 'crypto-js',
            echarts:'echarts'
        }),
        cssExtractor,
        new HtmlWebpackPlugin(vm.HtmlWebpackPluginConfig[env])
    ].concat(env==='product'?vm.pluginsProductAddition:[]),

    module: {
        preLoaders: [
            {
                test: /\.js$/,
                exclude: /(js\/dependencies|node_modules)/,
                loader: 'jshint-loader'
            }
        ],
        loaders: [{
            test: /\.js$/,
            exclude:/(node_modules)/,
            loaders: [
                'ng-annotate',
                'babel',
                'required?import[]=angular'
            ]
        }, {
            test: /\.json$/,
            loaders: [
                'file?name=[name].[ext]'
            ]
        }, {
            test: /\.scss$/,
            loader: cssExtractor.extract('style', 'css?sourceMap!sass?sourceMap'),
            include: path.resolve(__dirname, 'resource/styles')
        }, {
            test: /\.css$/,
            loader: cssExtractor.extract('style-loader', 'css-loader'),
            include: path.resolve(__dirname, 'resource/styles')
        }, {
            test: /\.css$/,
            loaders: [
                'file?name=styles/[name].[ext]',
                'extract',
                'css'
            ],
            exclude: path.resolve(__dirname, 'resource/styles')
        }, {
            test: /\.css\.map$/,
            loader: 'file?name=styles/[name].[ext]'
        }, {
            test: path.resolve(__dirname, 'templates/index.html'),
            loader: 'html?name=[name].[ext]'
        }, {
            test: /\.html$/,
            exclude: path.resolve(__dirname, 'templates/index.html'),
            loaders: [
                'file?name=[path][name].[ext]',
                'extract',
                'html?config=htmlLoaderConfig'
            ]
        }, {
            test: /\.(jpe?g|png(\*)?|gif)$/,
            loaders: vm.imageLoaderConfig[env]
        }, {
            test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file?name=fonts/[name].[ext]'
        }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loaders: [
                'url?mimetype=image/svg+xml',
                'file?name=fonts/[name].[ext]'
            ]
        }],
        noParse: [
            path.resolve(__dirname,'node_modules/sweetalert/dist/sweetalert.min.js')
        ]
    },

    jshint: {
        emitErrors: true,
        failOnHint: true,
        reporter:stylishReporter
    },

    htmlLoaderConfig: {
        root: __dirname,
        attrs: ['img:src', 'link:href']
    }
};
(env==='dev'?webpackConfig.devtool="source-map":null);

module.exports = webpackConfig;