export type ValidationSeverity = 'error' | 'warning';

export interface ValidationError {
  path: string;
  message: string;
  severity: ValidationSeverity;
  line?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
