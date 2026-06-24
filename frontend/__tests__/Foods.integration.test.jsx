import React, { useEffect, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const { rest, server } = require('../test/server');

function TestFoods() {
  const [foods, setFoods] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('http://localhost/foods')
      .then((r) => r.json())
      .then((data) => setFoods(data));
  }, []);

  async function addFood() {
    const res = await fetch('http://localhost/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const f = await res.json();
      setFoods((s) => [...s, f]);
    }
  }

  return (
    <div>
      <ul>
        {foods.map((f) => (
          <li key={f.id}>{f.name}</li>
        ))}
      </ul>
      <input aria-label="FoodName" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={addFood}>Add</button>
    </div>
  );
}

test('Foods: get list and create new food', async () => {
  server.use(
    rest.get('http://localhost/foods', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json([{ id: 'f1', name: 'Banana' }]));
    }),
    rest.post('http://localhost/foods', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(201), ctx.json({ id: 'f2', name: body.name }));
    })
  );

  render(<TestFoods />);

  expect(await screen.findByText('Banana')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('FoodName'), { target: { value: 'Maçã' } });
  fireEvent.click(screen.getByText('Add'));

  expect(await screen.findByText('Maçã')).toBeInTheDocument();
});
