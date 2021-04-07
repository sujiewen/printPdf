'use strict'
const path = require('path')
const appInfo = require('./package.json')

// const webpack = require('webpack') //引入webpack库
// const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin //引入webpack-bundle-analyzer

function resolve(dir) {
  return path.join(__dirname, dir)
}

const name = 'testPdf' // page title

// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
// You can change the port by the following method:
// port = 9527 npm run dev OR npm run dev --port = 9527
const port = process.env.port || process.env.npm_config_port || 8080 // dev port
// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: './',
  outputDir: 'dist/' + process.env.VUE_APP_BUILD_TYPE + appInfo.version,
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  devServer: {
    port: port,
    open: true, //浏览器自动打开页面
    https: false,
    hotOnly: false, //热更新（webpack已实现了，这里false即可）
    overlay: {
      warnings: false,
      errors: true
    }
    // https 没有配置成功
    // proxy: {
    //   '/api': {
    //     target: process.env.VUE_APP_API,
    //     ws: true,
    //     secure: false,
    //     changeOrigin: true,
    //     pathRewrite: {
    //       '^/api': ''
    //     },
    //     headers: {
    //       Referer: process.env.VUE_APP_BASE_URL
    //     }
    //   }
    // }
  },
  // configureWebpack: {
  //   devtool: 'source-map',
  //   // provide the app's title in webpack's name field, so that
  //   // it can be accessed in index.html to inject the correct title.
  //   name: name,
  //   resolve: {
  //     alias: {
  //       '@': resolve('src')
  //     }
  //   }
  // },
  configureWebpack: config => {
    // 屏蔽console
    config.optimization.minimizer[0].options.terserOptions.compress.drop_console =
      process.env.NODE_ENV === 'production'
    if (process.env.NODE_ENV === 'production') {
      // 为生产环境修改配置...
      config.mode = 'production'
    } else {
      // 为生产环境修改配置...
      config.mode = 'development'
      config.devtool = 'source-map'
    }
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    config.name = name
    // 开发生产共同配置别名
    Object.assign(config.resolve, {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    })
  },
  chainWebpack(config) {
    // it can improve the speed of the first screen, it is recommended to turn on preload
    // it can improve the speed of the first screen, it is recommended to turn on preload
    config.plugin('preload').tap(() => [
      {
        rel: 'preload',
        // to ignore runtime.js
        // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
        fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
        include: 'initial'
      }
    ])
    // config.plugin('ignore').use(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)) //忽略/moment/locale下的所有文件
    // config.plugin('analyzer').use(new BundleAnalyzerPlugin()) //使用webpack-bundle-analyzer 生成报表
    // config.plugin('loadshReplace').use(new LodashModuleReplacementPlugin()) //优化lodash

    // when there are many pages, it will cause too many meaningless requests
    config.plugins.delete('prefetch')

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    config.when(process.env.NODE_ENV !== 'development', config => {
      config
        .plugin('ScriptExtHtmlWebpackPlugin')
        .after('html')
        .use('script-ext-html-webpack-plugin', [
          {
            // `runtime` must same as runtimeChunk name. default is `runtime`
            inline: /runtime\..*\.js$/
          }
        ])
        .end()
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial' // only package third parties that are initially dependent
          },
          elementUI: {
            name: 'chunk-elementUI', // split elementUI into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
          },
          commons: {
            name: 'chunk-commons',
            test: resolve('src/components'), // can customize your rules
            minChunks: 3, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
      // https:// webpack.js.org/configuration/optimization/#optimizationruntimechunk
      config.optimization.runtimeChunk('single')
    })
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: 'testPdf',
        // "appId": "",
        publish: [
          {
            provider: 'generic',
            channel: 'latest',
            url: process.env.VUE_APP_UPDATE_APP_URL
          }
        ],
        electronDownload: {
          mirror: 'https://npm.taobao.org/mirrors/electron/'
        },
        win: {
          icon: './public/icons/logo.ico',
          requestedExecutionLevel: 'requireAdministrator',
          target: [
            {
              target: 'nsis',
              arch: [
                'x64', // 64位
                'ia32'
              ]
            }
          ]
        },
        mac: {
          icon: './public/icons/logo.icns'
        },
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: false, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, // 允许修改安装目录
          installerIcon: './public/icons/logo.ico', // 安装图标
          uninstallerIcon: './public/icons/logo.ico', // 卸载图标
          installerHeaderIcon: './public/icons/logo.ico', // 安装时头部图标
          createDesktopShortcut: true, // 创建桌面图标
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: 'testPdf' // 图标名称(项目名称) WMSWarehouse
        }
      }
      // mainProcessFile:  'src/background.js',
      // mainProcessWatch: ['src'],
    }
  }
}
