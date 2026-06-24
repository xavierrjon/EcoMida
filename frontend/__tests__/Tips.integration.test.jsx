import React, { useEffect, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const { rest, server } = require('../test/server');

function TipsComponent() {
  const [tips, setTips] = useState([]);

  useEffect(() => {
    fetch('http://localhost/tips')
      .then((r) => r.json())
      .then(setTips);
  }, []);

  async function toggleFavorite(id) {
    const res = await fetch(`http://localhost/tips/${id}/favorite`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setTips((t) => t.map((x) => (x.id === id ? { ...x, favorited: updated.favorited } : x)));
    }
  }

  return (
    <div>
      {tips.map((tip) => (
        <div key={tip.id}>
          <span>{tip.title}</span>
          <button onClick={() => toggleFavorite(tip.id)}>{tip.favorited ? 'Unfav' : 'Fav'}</button>
        </div>
      ))}
    </div>
  );
}

test('Tips: list and toggle favorite', async () => {
  server.use(
    rest.get('http://localhost/tips', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json([{ id: 't1', title: 'Dica 1', favorited: false }]));
    }),
    rest.post('http://localhost/tips/:id/favorite', (req, res, ctx) => {
      const { id } = req.params;
      return res(ctx.status(200), ctx.json({ id, favorited: true }));
    })
  );

  render(<TipsComponent />);

  expect(await screen.findByText('Dica 1')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Fav'));
  // button text changes to Unfav after toggle
  expect(await screen.findByText('Unfav')).toBeInTheDocument();
});
