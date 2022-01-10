
const merge = require('webpack-merge');
const ps = require('process');
const TerserPlugin = require('terser-webpack-plugin');

// const path = require("path");
const isProduction = ps.env.NODE_ENV === "production";
const argv = ps.argv[3];
const isargv = ps.argv[3] == '-devlog';
const isAnalyze = ps.argv[3] == '-analyze';
const minimizer = !isargv
    ? [
        new TerserPlugin({
            parallel: true,
            terserOptions: {
                output: { comments: false },
                compress: {
                    warnings: false,
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log']
                }
            }
        })
    ]
    : [];
function resolve (dir) {
    return path.join(__dirname, '..', dir)
}
console.log(ps.argv, 'argv', argv);

module.exports = {
    //publicPath: "wap",
     publicPath: "/wap",

    devServer: {
        port: 3001,
        //https: true,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:7072",
                ws: true,
                changeOrigin: true, //是否跨域
            },
        },
        disableHostCheck: true,
    },

    outputDir: undefined,
    assetsDir: undefined,
    runtimeCompiler: undefined,
    productionSourceMap: false,
    parallel: require("os").cpus().length > 1,
    css: {
        extract: true, // 是否使用css分离插件 ExtractTextPlugin
        loaderOptions: {
            sass: {
                prependData: '@import "@/styles/skin-color.scss";@import "@/styles/common.scss";',
            },
        },
    },
    // configureWebpack: {
    //     externals: process.env.NODE_ENV === 'production' ?
    //         getProdExternals() : {}
    // },
    configureWebpack: (config) => {
        if (process.env.NODE_ENV === "production") {
            // config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
            // 为生产环境修改配置...
            config.mode = "production";
            // config.externals = getProdExternals() 874.07 KiB
            // 将每个依赖包打包成单独的js文件
            let optimization = {
                // runtimeChunk: 'single',
                minimizer: minimizer,
                splitChunks: {
                    chunks: "all",
                    // maxInitialRequests: Infinity,
                    maxInitialRequests: 2,
                    minSize: 1,
                    cacheGroups: {
                        vendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                        },
                        default: {
                            minChunks: 1,
                            priority: -20,
                            reuseExistingChunk: true,
                        },
                    },
                    // minSize: 1024 * 200, // 依赖包超过20000bit将被单独打包
                    // cacheGroups: {
                    //     vendor: {
                    //         test: /[\\/]node_modules[\\/]/,
                    //         name(module) {
                    //             // get the name. E.g. node_modules/packageName/not/this/part.js
                    //             // or node_modules/packageName
                    //             const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
                    //             // npm package names are URL-safe, but some servers don't like @ symbols
                    //             return `npm.${packageName.replace('@', '')}`
                    //         }
                    //     }
                    // }
                },
            };
            Object.assign(config, {
                optimization,
                // plugins: [
                //     ...config.plugins,
                //     new MiniCssExtractPlugin({
                //         // Options similar to the same options in webpackOptions.output
                //         // both options are optional
                //         filename: '[name].css',
                //         chunkFilename: '[id].css',
                //     }),
                //     // new ExtractTextWebpackPlugin({ // 在plugins中配置属性
                //     //     allChunks: false // true表示会把所有的css都提取出来，false只会把初始化的提取，默认是false
                //     // })
                // ]
            });
            // console.log(config.plugins,pluginsssss)
        }
    },

    chainWebpack: (config) => {
        // 移除 prefetch 插件
        config.plugins.delete("prefetch");
        // 移除 preload 插件
        config.plugins.delete("preload");
        // 全部base64
        if (isProduction) {
            // 打包分析
            if (isAnalyze) {
                config
                    .plugin("webpack-bundle-analyzer")
                    .use(
                        require("webpack-bundle-analyzer").BundleAnalyzerPlugin
                    );
            }

            if (argv === "-noimg") {
                config.module
                    .rule("fontfile")
                    .test(/\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/)
                    .pre()
                    .include.add("/src/assets")
                    .add("/src/assets/img") ///loading.svg
                    .end()
                    .use("url-loader")
                    .loader("url-loader")
                    .tap((options) =>
                        merge(options, {
                            limit: 100000000000, /// 文件大小（打包无限制base64编码）
                        })
                    );
                config.module
                    .rule("images")
                    .use("image-webpack-loader")
                    .loader("image-webpack-loader")
                    .options({
                        bypassOnDebug: true,
                    });
                config.module
                    .rule("images")
                    .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
                    .use("url-loader")
                    .loader("url-loader")
                    .tap((options) =>
                        merge(options, {
                            limit: 100000000000, /// 文件大小（无限制base64编码）
                        })
                    );
            } else if (argv === "-img") {
                // 全部img
                config.module
                    .rule("images")
                    .use("image-webpack-loader")
                    .loader("image-webpack-loader")
                    .options({
                        bypassOnDebug: true,
                    });
                config.module
                    .rule("images")
                    .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
                    .use("url-loader")
                    .loader("url-loader")
                    .tap((options) =>
                        merge(options, {
                            // limit: 50*1024 /// 文件大小（低于50Kb才会base64编码）
                            limit: 100, /// 文件大小（低于50Kb才会base64编码）
                        })
                    );
                console.log(argv, "argv");
            } else {
                console.log("base64编译上限 build");
                // 设置base64编译上限
                config.module
                    .rule("images")
                    .use("image-webpack-loader")
                    .loader("image-webpack-loader")
                    .options({
                        bypassOnDebug: true,
                    });

                config.module
                    .rule("images")
                    .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
                    .use("url-loader")
                    .loader("url-loader")
                    .tap((options) =>
                        merge(options, {
                            limit: 10240,
                            // publicPath: process.env.NODE_ENV === 'production' ? 'https://oss.xx.com/img' : './',
                            // publicPath: 'https://xxxx/img',
                            // outputPath: 'img',
                            // name: '[name].[ext]',
                        })
                    );
            }
        }
    },
};