import express from 'express';
import { clienteRoutes } from './routes/cliente.routes';
import { produtoRoutes } from './routes/produto.routes';
import { recargaRoutes } from './routes/recarga.routes';
import { vendaRoutes } from './routes/venda.routes';

const app = express();

app.use(express.json());

// Registrando as rotas modulares na API
app.use(clienteRoutes);
app.use(produtoRoutes);
app.use(recargaRoutes);
app.use(vendaRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Servidor da Cafeteria rodando na porta ${PORT}`);
});