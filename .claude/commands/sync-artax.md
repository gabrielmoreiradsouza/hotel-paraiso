# /sync-artax

Forçar reconciliação com Artax.

Executar:

1. Verificar credenciais Artax em `.env.local`
2. Disparar job de reconciliação via BullMQ ou script direto
3. Reportar: itens processados, divergências encontradas, erros
4. Atualizar `event_log` com resultado
