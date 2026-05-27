import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class ProdutoController {
  async create(req: Request, res: Response): Promise<Response> {
    const { nome, quant, preco } = req.body;
    try {
      const produto = await prisma.produto.create({
        data: { nome, quant, preco }
      });
      return res.status(201).json(produto);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao cadastrar produto.' });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const produtos = await prisma.produto.findMany();
      return res.json(produtos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
  }
}