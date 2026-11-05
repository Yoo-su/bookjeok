const { resolve } = require('node:path');
require('ts-node').register({
  project: resolve(__dirname, '../tsconfig.json'),
});
require('tsconfig-paths').register({
  baseUrl: resolve(__dirname, '..'),
  paths: { '@/*': ['src/*'] },
});
require('../test/search-preview-sql.native.ts');
