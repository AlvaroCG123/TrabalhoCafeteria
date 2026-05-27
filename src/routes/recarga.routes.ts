import { Router } from 'express';
import { RecargaController } from '../controller/recarga.controller';

const recargaRoutes = Router();
const recargaController = new RecargaController();

recargaRoutes.post('/recargas', recargaController.create);
recargaRoutes.get('/recargas', recargaController.list);

export { recargaRoutes };