import { Router } from 'express';
import { AlunoController } from '../controller/aluno.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const alunoRoutes = Router();
const alunoController = new AlunoController();

alunoRoutes.post('/alunos', authMiddleware, alunoController.create);
alunoRoutes.get('/alunos', authMiddleware, alunoController.list);

export { alunoRoutes };
