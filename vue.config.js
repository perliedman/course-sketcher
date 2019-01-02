module.exports = {
  chainWebpack: config => {
    config.module
      .rule('xml')
      .test(/\.xml$/)
      .use('raw-loader')
        .loader('raw-loader')
        .end()
  }
}
// configureWebpack: {
//   rules: [
//     {
//       test: /\.xml$/,
//       include: path.resolve(__dirname, ".."),
//       loader: require.resolve("raw-loader")
//     }
//   ]
// }
