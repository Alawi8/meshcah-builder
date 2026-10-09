import { nanoid } from 'nanoid';

export function generateId(): string {
  return 'el_' + nanoid(8);
}
