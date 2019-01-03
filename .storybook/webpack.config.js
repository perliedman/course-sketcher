const path = require("path");

module.exports = (baseConfig, env, defaultConfig) => {
  defaultConfig.module.rules.push({
    test: /\.(ppen|xml)$/,
    include: path.resolve(__dirname, ".."),
    loader: require.resolve("raw-loader")
  });
  defaultConfig.resolve.extensions.push(".ppen", ".xml");

  defaultConfig.module.rules.push({
    test: /node_modules\/(pdfkit|brotli|fontkit|linebreak|png-js|unicode-properties)/,
    loader: "transform-loader?brfs"
  });

  defaultConfig.node = defaultConfig.node || {}
  defaultConfig.node.fs = 'empty'
  
  return defaultConfig;
};