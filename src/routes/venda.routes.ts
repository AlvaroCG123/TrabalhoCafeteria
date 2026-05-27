import { Router } from 'express';
import { VendaController } from '../controller/venda.controller';

const vendaRoutes = Router();
const vendaController = new VendaController();

vendaRoutes.post('/vendas', vendaController.create); 
vendaRoutes.get('/vendas', vendaController.list);
vendaRoutes.delete('/vendas/:id', vendaController.delete);

export { vendaRoutes };