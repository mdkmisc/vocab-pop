/* WAS:
var config = {
  //"cdmSchema": "omop5_synpuf_5pcnt",
  //"resultsSchema": "omop5_synpuf_5pcnt_results",
  //"cdmSchema": "cdm2",
  //"resultsSchema": "results2",
  "cdmSchema": "cdm",
  "resultsSchema": "results",
  "apiRoot": "http://localhost:3000/api/vocabpops", // loopback adds an s
  "rootPath": "",

};
export default config;


switching to using .env, but still let modules import from config
*/

var config = {
  "cdmSchema": process.env.REACT_APP_CDM_SCHEMA,
  "resultsSchema": process.env.REACT_APP_RESULTS_SCHEMA,
  "apiRoot": process.env.REACT_APP_API_ROOT,
  "rootPath": process.env.REACT_APP_ROOTPATH,
};
export default config;
