import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  console.log(' Iniciando o seed do banco de dados (MariaDB/MySQL)...');

  // 1. Limpar dados antigos (Garante consistência ao rodar múltiplos testes)
  await prisma.venda.deleteMany();
  await prisma.recarga.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.cliente.deleteMany();

  // 2. Cadastrar Clientes Iniciais
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Álvaro Cantos',
      email: 'alvaro@gmail.com',
      saldo_credit: 50.00
    }
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Giuli',
      email: 'giuli@gmail.com',
      saldo_credit: 20.00
    }
  });

  // 3. Cadastrar Produtos Iniciais
  const cafe = await prisma.produto.create({
    data: {
      nome: 'Café Expresso',
      quant: 100,
      preco: 5.50
    }
  });

  const pastel = await prisma.produto.create({
    data: {
      nome: 'Pastel de Carne',
      quant: 30,
      preco: 8.00
    }
  });

  const paoDeQueijo = await prisma.produto.create({
    data: {
      nome: 'Pão de Queijo',
      quant: 50,
      preco: 4.50
    }
  });

  // 4. Criar uma Recarga/Depósito inicial
  await prisma.recarga.create({
    data: {
      clienteId: cliente1.id,
      tipo: 'PIX',
      valor: 30.00
    }
  });

  // 5. Criar uma Venda inicial utilizando a transação implícita do Prisma
  await prisma.venda.create({
    data: {
      clienteId: cliente1.id,
      produtoId: cafe.id,
      quant: 2,
      preco: cafe.preco
    }
  });

  console.log('✅ Seed executado com sucesso no MariaDB!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao rodar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });