import type { SwaggerDocument } from '../types/swagger';

const STORAGE_KEY = 'openapi-builder-document';
const STORAGE_VERSION = '1.0';
const FORM_COLLAPSED_KEY = 'openapi-builder-form-collapsed';

interface StoredData {
  document: SwaggerDocument;
  lastSaved: string;
  version: string;
}

/**
 * Save document to LocalStorage
 */
export const saveDocument = (doc: SwaggerDocument): boolean => {
  try {
    const data: StoredData = {
      document: doc,
      lastSaved: new Date().toISOString(),
      version: STORAGE_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.error('Failed to save document to LocalStorage:', error);
    return false;
  }
};

/**
 * Load document from LocalStorage
 */
export const loadDocument = (): { document: SwaggerDocument; lastSaved: Date } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: StoredData = JSON.parse(stored);
    
    // Version check for future migrations
    if (data.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch: ${data.version} vs ${STORAGE_VERSION}`);
      // For now, still try to load - future versions could migrate here
    }

    // Validate that it looks like a SwaggerDocument
    if (!data.document || typeof data.document !== 'object') {
      console.error('Invalid stored document structure');
      return null;
    }

    return {
      document: data.document,
      lastSaved: new Date(data.lastSaved),
    };
  } catch (error) {
    console.error('Failed to load document from LocalStorage:', error);
    return null;
  }
};

/**
 * Clear saved document from LocalStorage
 */
export const clearDocument = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear document from LocalStorage:', error);
  }
};

/**
 * Check if a document exists in LocalStorage
 */
export const hasStoredDocument = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

/**
 * Get the last saved timestamp without loading the full document
 */
export const getLastSavedTime = (): Date | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: StoredData = JSON.parse(stored);
    return new Date(data.lastSaved);
  } catch {
    return null;
  }
};

/**
 * Save form collapsed state to LocalStorage
 */
export const saveFormCollapsedState = (isCollapsed: boolean): void => {
  try {
    localStorage.setItem(FORM_COLLAPSED_KEY, JSON.stringify(isCollapsed));
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Load form collapsed state from LocalStorage
 */
export const loadFormCollapsedState = (): boolean => {
  try {
    const stored = localStorage.getItem(FORM_COLLAPSED_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors
  }
  return false; // Default to expanded
};
