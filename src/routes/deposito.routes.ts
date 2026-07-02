import { Router } from 'express';
import { DepositoController } from '../controller/deposito.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const depositoRoutes = Router();
const depositoController = new DepositoController();

depositoRoutes.post('/depositos', authMiddleware, depositoController.create);
depositoRoutes.get('/depositos', authMiddleware, depositoController.list);

export { depositoRoutes };
