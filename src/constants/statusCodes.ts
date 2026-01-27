export const STATUS_CODES = [
  { value: '200', label: '200 - OK' },
  { value: '201', label: '201 - Created' },
  { value: '204', label: '204 - No Content' },
  { value: '400', label: '400 - Bad Request' },
  { value: '401', label: '401 - Unauthorized' },
  { value: '403', label: '403 - Forbidden' },
  { value: '404', label: '404 - Not Found' },
  { value: '500', label: '500 - Internal Server Error' },
] as const;

export const SUCCESS_STATUS_CODES = ['200', '201', '204'] as const;
export const ERROR_STATUS_CODES = ['400', '401', '403', '404', '500'] as const;