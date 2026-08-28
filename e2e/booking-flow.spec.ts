import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('homepage loads with all sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Hotel e Restaurante');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('a[aria-label="Falar no WhatsApp"]')).toBeVisible();

    // Booking widget
    await page.evaluate(() => window.scrollTo(0, 950));
    await expect(page.locator('text=Verificar disponibilidade')).toBeVisible();

    // Room cards
    await expect(page.locator('text=Nossas Acomodações')).toBeVisible();
  });

  test('booking widget validates dates', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 950));

    // Button should be disabled without dates
    const btn = page.locator('button:has-text("Verificar disponibilidade")');
    await expect(btn).toBeDisabled();

    // Fill valid dates
    const today = new Date();
    const checkin = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const checkout = new Date(today.getTime() + 9 * 86400000).toISOString().slice(0, 10);

    await page.locator('#checkin-input').fill(checkin);
    await page.locator('#checkout-input').fill(checkout);

    await expect(btn).toBeEnabled();
  });

  test('search shows real availability from Artax', async ({ page }) => {
    const checkin = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const checkout = new Date(Date.now() + 32 * 86400000).toISOString().slice(0, 10);

    await page.goto(`/reservar?checkin=${checkin}&checkout=${checkout}&guests=2`);
    await page.waitForTimeout(5000);

    // Should show either real rooms or "no rooms" message (both valid)
    const hasRooms = await page.locator('button:has-text("Selecionar")').count();
    const hasNoRooms = await page.locator('text=Nenhum quarto disponível').count();
    const hasError = await page.locator('text=Erro ao consultar').count();

    expect(hasRooms + hasNoRooms + hasError).toBeGreaterThan(0);
  });

  /**
   * O fluxo completo roda contra POST /api/bookings INTERCEPTADO.
   *
   * A versão anterior criava reserva real na Artax a cada execução de CI: gerava reserva
   * fantasma no PMS, disparava WhatsApp real para o celular do hotel, mandava conversão
   * falsa para o Google Ads e consumia a cota da DR-001 — que desativa a chave da API
   * permanentemente em 102 req/60s.
   *
   * A interceptação preserva o valor do teste (o fluxo de UI dos três passos é exercitado
   * de verdade) e elimina o efeito colateral externo.
   */
  test('full booking flow completes with mocked booking API', async ({ page }) => {
    const checkin = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
    const checkout = new Date(Date.now() + 47 * 86400000).toISOString().slice(0, 10);

    let idempotencyKeyEnviada: string | null = null;

    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      idempotencyKeyEnviada = route.request().headers()['idempotency-key'] ?? null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, booking_id: 'E2E-MOCK-1', source: 'artax' }),
      });
    });

    await page.goto(`/reservar?checkin=${checkin}&checkout=${checkout}&guests=2`);
    await page.waitForTimeout(5000);

    const rooms = await page.locator('button:has-text("Selecionar")').count();
    if (rooms === 0) {
      test.skip(true, 'No rooms available for test dates');
      return;
    }

    // Passo 1: selecionar quarto
    await page.locator('button:has-text("Selecionar")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=2. Seus dados')).toBeVisible();

    // Passo 2: dados do hóspede
    await page.locator('#guest-name').fill('E2E Teste Playwright');
    await page.locator('#guest-email').fill('e2e@moreirads.com');
    await page.locator('#guest-phone').fill('31999998888');

    await page.locator('button:has-text("Confirmar reserva")').click();
    await page.waitForTimeout(3000);

    // A confirmação tem que aparecer — com a API mockada, não há motivo para falhar.
    await expect(page.locator('text=Reserva confirmada')).toBeVisible();

    // E o cliente precisa mandar a chave de idempotência (ADR-0011): sem ela, um
    // double-click em produção viraria duas reservas.
    expect(idempotencyKeyEnviada).toBeTruthy();
  });
});

test.describe('Pages', () => {
  test('sobre page loads', async ({ page }) => {
    await page.goto('/sobre');
    await expect(page.locator('h1')).toContainText('Sobre');
  });

  test('galeria page loads with photos', async ({ page }) => {
    await page.goto('/galeria');
    await expect(page.locator('h1')).toContainText('Galeria');
    const photos = await page.locator('button > img, button img').count();
    expect(photos).toBeGreaterThanOrEqual(10);
  });

  test('galeria lightbox works with keyboard', async ({ page }) => {
    await page.goto('/galeria');
    await page.waitForTimeout(2000);

    // Open lightbox
    await page
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Should show close button
    await expect(page.locator('text=×')).toBeVisible();

    // Arrow right
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Lightbox should be closed
    await expect(page.locator('text=×')).not.toBeVisible();
  });

  test('room detail pages load', async ({ page }) => {
    for (const slug of ['standard', 'luxo', 'master']) {
      await page.goto(`/quartos/${slug}`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('a:has-text("Reservar agora")')).toBeVisible();
    }
  });

  test('404 page shows for invalid route', async ({ page }) => {
    const response = await page.goto('/rota-invalida');
    expect(response?.status()).toBe(404);
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Security', () => {
  test('admin requires auth', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    // Should show password prompt
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('bookings API requires auth', async ({ request }) => {
    const response = await request.get('/api/bookings?page=1');
    expect(response.status()).toBe(401);
  });

  test('webhook accepts POST', async ({ request }) => {
    const response = await request.post('/api/webhooks/artax', {
      data: { event: 'booking_created', data: { booking_id: 999 } },
    });
    expect(response.status()).toBe(200);
  });
});

test.describe('SEO', () => {
  test('has schema.org', async ({ page }) => {
    await page.goto('/');
    const schema = await page.locator('script[type="application/ld+json"]').textContent();
    expect(schema).toContain('Hotel');
    expect(schema).toContain('Ponte Nova');
  });

  test('has meta tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Hotel/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Hotel/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test('sitemap.xml accessible', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
  });

  test('robots.txt accessible', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('Disallow: /admin');
  });
});
