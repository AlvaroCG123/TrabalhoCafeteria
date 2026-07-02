import { Router } from 'express';
import { EmprestimoController } from '../controller/emprestimo.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const emprestimoRoutes = Router();
const emprestimoController = new EmprestimoController();

emprestimoRoutes.post('/emprestimos', authMiddleware, emprestimoController.create);
emprestimoRoutes.get('/emprestimos', authMiddleware, emprestimoController.list);
emprestimoRoutes.delete('/emprestimos/:id', authMiddleware, emprestimoController.delete);

export { emprestimoRoutes };