export const generateOperationId = (method: string, pathStr: string): string => {
  const pathParts = pathStr
    .split('/')
    .filter((p) => p && !p.startsWith('{'));

  // Only use the last part of the path
  const lastPart = pathParts[pathParts.length - 1] || '';

  // Split by hyphens and capitalize each word, then join
  const formattedPart = lastPart
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `${method}${formattedPart}`;
};