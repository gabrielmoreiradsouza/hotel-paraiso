import { setupServer } from 'msw/node';
import { artaxHandlers } from './handlers';

export const mockServer = setupServer(...artaxHandlers);
