//var dotenv = require('dotenv');
//console.log(dotenv);
var config = {
  "cdmSchema": process.env.REACT_APP_CDM_SCHEMA,
  "resultsSchema": process.env.REACT_APP_RESULTS_SCHEMA,
  "apiRoot": process.env.REACT_APP_API_ROOT,
  "apiModel": process.env.REACT_APP_API_MODEL,
  "rootPath": process.env.REACT_APP_ROOTPATH,
};
//console.log(config);
export default config;
