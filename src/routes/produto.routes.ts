import { Router } from 'express';
import { ProdutoController } from '../controller/produto.controller';

const produtoRoutes = Router();
const produtoController = new ProdutoController();

produtoRoutes.post('/produtos', produtoController.create);
produtoRoutes.get('/produtos', produtoController.list);

export { produtoRoutes };