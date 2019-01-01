const path = require("path");

module.exports = (baseConfig, env, defaultConfig) => {
  // Extend defaultConfig as you need.

  // For example, add typescript loader:
  defaultConfig.module.rules.push({
    test: /\.ppen$/,
    include: path.resolve(__dirname, ".."),
    loader: require.resolve("raw-loader")
  });
  defaultConfig.resolve.extensions.push(".ppen");

  return defaultConfig;
};