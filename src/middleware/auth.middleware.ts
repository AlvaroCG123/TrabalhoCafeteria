import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { extrairTokenDoHeader, verificarToken } from '../utils/security';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const token = extrairTokenDoHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Token nao informado.' });
  }

  const payload = verificarToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
  });

  if (!usuario || usuario.status !== 'ATIVO') {
    return res.status(401).json({ error: 'Usuario nao autorizado.' });
  }

  req.authUser = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    nivelAcesso: usuario.nivelAcesso,
  };

  return next();
}