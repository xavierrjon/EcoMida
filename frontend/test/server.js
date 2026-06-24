const { setupServer } = require('msw/node');
const { rest } = require('msw');

const server = setupServer();

module.exports = { server, rest };
