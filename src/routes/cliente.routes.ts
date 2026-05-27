import { Router } from 'express';
import { ClienteController } from '../controller/cliente.controller';

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.post('/clientes', clienteController.create);
clienteRoutes.get('/clientes', clienteController.list);

export { clienteRoutes };