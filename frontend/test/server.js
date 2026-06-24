const { setupServer } = require('msw/node');
const { rest } = require('msw');
const { handlers } = require('./handlers');

const server = setupServer(...handlers);

module.exports = { server, rest, handlers };
