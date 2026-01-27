import type { PathParameter } from '../types/swagger';

/**
 * Extract path parameters from a path string (e.g., /users/{id}/posts/{postId})
 * Returns an array of parameter names: ['id', 'postId']
 */
export const extractPathParameters = (path: string): string[] => {
  const regex = /\{([^}]+)\}/g;
  const params: string[] = [];
  let match;
  while ((match = regex.exec(path)) !== null) {
    params.push(match[1]);
  }
  return params;
};

/**
 * Sync path parameters - adds missing params and removes params no longer in path
 * Preserves existing parameter details (description, type, etc.)
 */
export const syncPathParameters = (
  currentParams: PathParameter[],
  pathString: string
): PathParameter[] => {
  const detectedParamNames = extractPathParameters(pathString);
  
  // Keep existing path params that are still in the path (preserve their details)
  const existingPathParams = currentParams.filter(
    (p) => p.in === 'path' && detectedParamNames.includes(p.name)
  );
  
  // Keep all non-path params (query, header, cookie)
  const nonPathParams = currentParams.filter((p) => p.in !== 'path');
  
  // Find new path params that don't exist yet
  const existingPathParamNames = existingPathParams.map((p) => p.name);
  const newPathParams: PathParameter[] = detectedParamNames
    .filter((name) => !existingPathParamNames.includes(name))
    .map((name) => ({
      name,
      in: 'path' as const,
      description: '',
      required: true,
      type: 'string',
    }));
  
  // Return path params first (in order they appear), then non-path params
  const orderedPathParams = detectedParamNames
    .map((name) => 
      existingPathParams.find((p) => p.name === name) || 
      newPathParams.find((p) => p.name === name)
    )
    .filter((p): p is PathParameter => p !== undefined);
  
  return [...orderedPathParams, ...nonPathParams];
};