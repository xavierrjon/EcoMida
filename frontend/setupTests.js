import '@testing-library/jest-dom/extend-expect';
import 'whatwg-fetch';
const { server } = require('./test/server');

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
