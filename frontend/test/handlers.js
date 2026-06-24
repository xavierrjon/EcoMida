const { rest } = require('msw');

const handlers = [
  // Auth
  rest.post('http://localhost/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: 'u1' })
    );
  }),
  rest.post('http://localhost/auth/login', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(200),
      ctx.json({ access_token: 'token-123', user: { id: 'u1', email: body.email || 'user@example.com', username: 'User' } })
    );
  }),
  rest.get('http://localhost/auth/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: 'u1', email: 'user@example.com', username: 'User' })
    );
  }),

  // Foods
  rest.get('http://localhost/foods', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([{ id: 'f1', name: 'Banana' }])
    );
  }),
  rest.post('http://localhost/foods', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({ id: 'f2', name: body.name || 'Unknown' })
    );
  })
  ,
  // Tips
  rest.get('http://localhost/tips', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 't1', title: 'Dica 1', favorited: false },
        { id: 't2', title: 'Dica 2', favorited: true }
      ])
    );
  }),
  rest.post('http://localhost/tips/:id/favorite', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({ id, favorited: true })
    );
  }),

  // Notifications
  rest.get('http://localhost/notifications/expiring', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([{ id: 'n1', food: 'Leite', expires_in_days: 2 }])
    );
  }),
  rest.get('http://localhost/notifications/settings', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ email: true, push: false }));
  }),
  rest.put('http://localhost/notifications/settings', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(200), ctx.json(body));
  }),

  // Profile update & logout
  rest.put('http://localhost/auth/profile', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(200), ctx.json(Object.assign({ id: 'u1' }, body)));
  }),
  rest.post('http://localhost/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ ok: true }));
  })
];

module.exports = { handlers, rest };
