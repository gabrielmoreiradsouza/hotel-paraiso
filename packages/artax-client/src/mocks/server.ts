import { setupServer } from 'msw/node';
import { artaxHandlers } from './handlers.js';

export const mockServer = setupServer(...artaxHandlers);
