function montarCabecalho(assunto: string, destinatario: string): string {
  return `E-mail de segurança para ${destinatario} | ${assunto}`;
}

export async function enviarEmailSeguranca(
  destinatario: string,
  assunto: string,
  mensagem: string,
): Promise<void> {
  const cabecalho = montarCabecalho(assunto, destinatario);

  console.log('----------------------------------------');
  console.log(cabecalho);
  console.log(mensagem);
  console.log('----------------------------------------');
}

export function montarLinkAtivacao(codigoAtivacao: number): string {
  const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';

  return `${baseUrl}/usuarios/ativar/${codigoAtivacao}`;
}

export function montarMensagemRecuperacao(codigo: string): string {
  return `Seu codigo de recuperacao e ${codigo}. Ele expira em 30 minutos.`;
}