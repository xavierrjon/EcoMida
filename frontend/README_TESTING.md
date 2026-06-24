Setup rápido para rodar os testes React + MSW

1) Na pasta `frontend`, instale dependências:

```bash
cd frontend
npm install
```

2) Executar os testes:

```bash
npm test
```

Arquivos adicionados:
- [frontend/package.json](frontend/package.json)
- [frontend/jest.config.js](frontend/jest.config.js)
- [frontend/babel.config.js](frontend/babel.config.js)
- [frontend/setupTests.js](frontend/setupTests.js)
- [frontend/test/server.js](frontend/test/server.js)
- [frontend/src/Login.jsx](frontend/src/Login.jsx)
- [frontend/__tests__/Login.test.jsx](frontend/__tests__/Login.test.jsx)

Notas:
- O teste usa `msw` (Mock Service Worker) para simular a API sem subir o backend.
- Se já tiver um `package.json` no projeto, compare dependências antes de mesclar.
