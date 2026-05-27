import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class ClienteController {
  async create(req: Request, res: Response): Promise<Response> {
    const { nome, email, saldo_credit } = req.body;
    try {
      const cliente = await prisma.cliente.create({
        data: { nome, email, saldo_credit: saldo_credit || 0 }
      });
      return res.status(201).json(cliente);
    } catch (error: any) {
      return res.status(400).json({ error: 'Erro ao cadastrar cliente. Verifique se o e-mail já existe.' });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const clientes = await prisma.cliente.findMany();
      return res.json(clientes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  }
}