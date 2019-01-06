module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/course-sketcher'
    : '/',
  chainWebpack: config => {
    config.node.set('process', true)

    config.module
      .rule('xml')
      .test(/\.xml$/)
      .use('raw-loader')
        .loader('raw-loader')
        .end()

    config.module
      .rule('pdfkit')
      .test(/node_modules\/(pdfkit|brotli|fontkit|linebreak|png-js|unicode-properties)/)
      .use('transform-loader?brfs')
        .loader('transform-loader?brfs')
        .end()
  }
}
