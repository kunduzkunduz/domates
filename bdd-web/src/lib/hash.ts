import { SHA256 } from 'crypto-js';

export const createHash = (content: string): string => {
  return SHA256(content).toString();
};