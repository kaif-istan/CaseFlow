import express from 'express';
const app = express();
app.use(express.json());
app.get('/', (_, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT, () => console.log('API running on http://localhost:4000'));