export const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

export const METHOD_COLORS: Record<string, string> = {
  get: '#61affe',
  post: '#49cc90',
  put: '#fca130',
  delete: '#f93e3e',
  patch: '#50e3c2',
};

export const getMethodColor = (method: string): string => {
  return METHOD_COLORS[method] || '#999';
};