import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../src/Login';
const { rest, server } = require('../test/server');

test('integração do login: form envia e trata resposta', async () => {
  server.use(
    rest.post('http://localhost/auth/login', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ token: 'abc', userId: '1' })
      );
    })
  );

  render(<Login />);

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'user@example.com' }
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'password' }
  });
  fireEvent.click(screen.getByText('Entrar'));

  expect(await screen.findByText('Login bem-sucedido')).toBeInTheDocument();
});
