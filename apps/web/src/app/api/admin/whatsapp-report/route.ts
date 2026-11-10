import { NextResponse } from 'next/server';
import { hasReportReadToken, isAdminAuthed } from '@/lib/admin-session';
import { isArtaxConfigured } from '@/lib/artax';
import { MAX_REPORT_DAYS, buildWhatsAppReport } from '@/lib/whatsapp-report';

/**
 * Relatório do funil do WhatsApp (ADR-0012). `?days=7` por padrão, máximo 21 (ver MAX_REPORT_DAYS).
 * Aceita sessão de admin ou o token só de leitura do relatório.
 */
export async function GET(request: Request) {
  if (!hasReportReadToken(request) && !(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isArtaxConfigured) {
    return NextResponse.json({ error: 'Artax not configured' }, { status: 503 });
  }

  const raw = Number(new URL(request.url).searchParams.get('days') ?? '7');
  // Acima do teto, reduz para o teto (não volta para 7): quem pede 30 dias para enviar
  // reservas ao Google Ads continua recebendo o máximo, e `periodo.dias` diz o que foi usado.
  const days = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, MAX_REPORT_DAYS) : 7;

  try {
    return NextResponse.json(await buildWhatsAppReport(days), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[whatsapp-report] falhou:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 502 });
  }
}
