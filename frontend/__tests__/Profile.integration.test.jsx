import React, { useEffect, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const { rest, server } = require('../test/server');

function ProfileComponent() {
  const [profile, setProfile] = useState({ username: '', email: '' });

  useEffect(() => {
    fetch('http://localhost/auth/profile')
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  async function update() {
    const res = await fetch('http://localhost/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'NewName' })
    });
    if (res.ok) setProfile(await res.json());
  }

  return (
    <div>
      <div>{profile.username}</div>
      <button onClick={update}>Update</button>
    </div>
  );
}

test('Profile: get and update profile', async () => {
  server.use(
    rest.get('http://localhost/auth/profile', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ id: 'u1', username: 'OldName', email: 'a@b.com' }));
    }),
    rest.put('http://localhost/auth/profile', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(200), ctx.json({ id: 'u1', username: body.username, email: 'a@b.com' }));
    })
  );

  render(<ProfileComponent />);

  expect(await screen.findByText('OldName')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Update'));
  expect(await screen.findByText('NewName')).toBeInTheDocument();
});
