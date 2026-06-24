import React, { useEffect, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const { rest, server } = require('../test/server');

function NotificationsComponent() {
  const [expiring, setExpiring] = useState([]);
  const [settings, setSettings] = useState({ email: false, push: false });

  useEffect(() => {
    fetch('http://localhost/notifications/expiring')
      .then((r) => r.json())
      .then(setExpiring);
    fetch('http://localhost/notifications/settings')
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function updateSettings() {
    const res = await fetch('http://localhost/notifications/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: !settings.email, push: settings.push })
    });
    if (res.ok) setSettings(await res.json());
  }

  return (
    <div>
      <ul>
        {expiring.map((e) => (
          <li key={e.id}>{e.food}</li>
        ))}
      </ul>
      <div>email: {String(settings.email)}</div>
      <button onClick={updateSettings}>ToggleEmail</button>
    </div>
  );
}

test('Notifications: expiring list and update settings', async () => {
  server.use(
    rest.get('http://localhost/notifications/expiring', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json([{ id: 'n1', food: 'Leite' }]));
    }),
    rest.get('http://localhost/notifications/settings', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ email: true, push: false }));
    }),
    rest.put('http://localhost/notifications/settings', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(200), ctx.json(body));
    })
  );

  render(<NotificationsComponent />);

  expect(await screen.findByText('Leite')).toBeInTheDocument();
  expect(await screen.findByText(/email: true/)).toBeInTheDocument();

  fireEvent.click(screen.getByText('ToggleEmail'));
  expect(await screen.findByText(/email: false/)).toBeInTheDocument();
});
