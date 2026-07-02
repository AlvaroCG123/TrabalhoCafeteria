import { Router } from 'express';
import { UsuarioController } from '../controller/usuario.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const usuarioRoutes = Router();
const usuarioController = new UsuarioController();

usuarioRoutes.post('/usuarios', usuarioController.create);
usuarioRoutes.get('/usuarios', authMiddleware, usuarioController.list);
usuarioRoutes.get('/usuarios/ativar/:codigoAtivacao', usuarioController.activate);
usuarioRoutes.post('/usuarios/login', usuarioController.login);
usuarioRoutes.post('/usuarios/recuperar-senha', usuarioController.requestPasswordReset);
usuarioRoutes.post('/usuarios/redefinir-senha', usuarioController.resetPassword);
usuarioRoutes.patch('/usuarios/alterar-senha', authMiddleware, usuarioController.changePassword);

export { usuarioRoutes };