import { ID_PATTERN } from './constants.js';
import { ValidationError } from './errors.js';

export function validateId(id: string, label: string): string {
  if (!ID_PATTERN.test(id)) {
    throw new ValidationError(`Invalid ${label}: ${id}`);
  }
  return id;
}
