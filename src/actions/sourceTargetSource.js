import { services } from '../services/api';

function get(id) {
  return services.sourceTargetSource.get(id);
}

export default {
  get,
};
