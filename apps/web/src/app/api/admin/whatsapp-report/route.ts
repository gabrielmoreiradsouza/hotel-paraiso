import { NextResponse } from 'next/server';
import { hasReportReadToken, isAdminAuthed } from '@/lib/admin-session';
import { isArtaxConfigured } from '@/lib/artax';
import { buildWhatsAppReport } from '@/lib/whatsapp-report';

/**
 * Relatório do funil do WhatsApp (ADR-0012). `?days=7` por padrão, máximo 90.
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
  const days = Number.isInteger(raw) && raw >= 1 && raw <= 90 ? raw : 7;

  try {
    return NextResponse.json(await buildWhatsAppReport(days), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[whatsapp-report] falhou:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 502 });
  }
}
