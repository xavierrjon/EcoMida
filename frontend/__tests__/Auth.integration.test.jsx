import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const { rest, server } = require('../test/server');

function TestAuthFlow() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleRegister() {
    const res = await fetch('http://localhost/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.status === 201) setMessage('Registered');
    else setMessage('Register error');
  }

  async function handleLogin() {
    const res = await fetch('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      setMessage('Logged in');
    } else setMessage('Login error');
  }

  async function loadProfile() {
    const res = await fetch('http://localhost/auth/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setMessage(`Profile: ${data.username}`);
    } else setMessage('Profile error');
  }

  return (
    <div>
      <label>
        Email
        <input aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Senha
        <input aria-label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
      <button onClick={loadProfile}>LoadProfile</button>
      {message && <div>{message}</div>}
    </div>
  );
}

test('Auth: register -> login -> profile', async () => {
  server.use(
    rest.post('http://localhost/auth/register', (req, res, ctx) => {
      return res(ctx.status(201), ctx.json({ id: 'u1' }));
    }),
    rest.post('http://localhost/auth/login', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(200), ctx.json({ access_token: 'tok-1', user: { id: 'u1', email: body.email } }));
    }),
    rest.get('http://localhost/auth/profile', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ id: 'u1', email: 'user@example.com', username: 'TestUser' }));
    })
  );

  render(<TestAuthFlow />);

  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password' } });

  fireEvent.click(screen.getByText('Register'));
  expect(await screen.findByText('Registered')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Login'));
  expect(await screen.findByText('Logged in')).toBeInTheDocument();

  fireEvent.click(screen.getByText('LoadProfile'));
  expect(await screen.findByText(/Profile: TestUser/)).toBeInTheDocument();
});
