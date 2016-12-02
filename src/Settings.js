import yaml from 'js-yaml';
import settingsYaml from './domains.yml';
let settings = yaml.safeLoad(settingsYaml);
export default settings;

//let settings = _.merge({}, domainsYaml);
