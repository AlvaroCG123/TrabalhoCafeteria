import { Router } from 'express';
import { LivroController } from '../controller/livro.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const livroRoutes = Router();
const livroController = new LivroController();

livroRoutes.post('/livros', authMiddleware, livroController.create);
livroRoutes.get('/livros', authMiddleware, livroController.list);
livroRoutes.delete('/livros/:id', authMiddleware, livroController.delete);

export { livroRoutes };
