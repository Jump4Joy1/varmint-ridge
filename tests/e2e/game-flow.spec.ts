import { expect, test, type Page } from '@playwright/test';

async function boot(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem('vr.theme', 'auto');
    } catch {
      /* ignore */
    }
  });
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean((window as unknown as { VR?: unknown }).VR));
}

async function answerGate(page: Page) {
  await page.waitForFunction(() => document.getElementById('sGate')?.classList.contains('show'));
  await page.evaluate(() => {
    const m = document.getElementById('gateQ')?.textContent?.match(/(\d+)\s*×\s*(\d+)/);
    const el = document.getElementById('gateA') as HTMLInputElement | null;
    if (el && m) el.value = String(Number(m[1]) * Number(m[2]));
    document.getElementById('gateGo')?.click();
  });
  await page.waitForFunction(() => document.getElementById('sStore')?.classList.contains('show'));
}

test.describe('Varmint Ridge playthrough', () => {
  test('start, first-run tutorial, then the yard', async ({ page }) => {
    await boot(page);
    await expect(page.locator('#sTitle')).toHaveClass(/show/);
    await expect(page.getByRole('heading', { name: 'Varmint Ridge' })).toBeVisible();
    await page.locator('#bPlay').click();
    await expect(page.locator('#sTutorial')).toHaveClass(/show/);
    await page.locator('#bTutorialGo').click();
    await expect(page.locator('#sTitle')).not.toHaveClass(/show/);
    const step = await page.evaluate(() => (window as unknown as { VR: { teachStep: () => number } }).VR.teachStep());
    expect(step).toBe(1);
  });

  test('tutorial, a wave win, and a loss', async ({ page }) => {
    await boot(page);
    await page.locator('#bPlay').click();
    await page.locator('#bTutorialGo').click();
    const placed = await page.evaluate(() => {
      const VR = (window as unknown as {
        VR: {
          place: (t: string, x: number, y: number) => boolean;
          startWave: () => void;
          step: (n: number) => void;
          S: { queue: unknown[]; foes: unknown[]; phase: string; wave: number };
        };
      }).VR;
      const ok = VR.place('scarecrow', 200, 360);
      VR.startWave();
      VR.S.queue = [];
      VR.S.foes = [];
      VR.step(0.05);
      return { ok, phase: VR.S.phase, wave: VR.S.wave };
    });
    expect(placed.ok).toBe(true);
    await page.waitForFunction(() => document.getElementById('sShop')?.classList.contains('show'));
    await expect(page.locator('#shopTitle')).toHaveText('Wave Cleared!');
    await page.locator('#bShopDone').click();
    await page.evaluate(() => {
      const VR = (window as unknown as {
        VR: { begin: (w: number) => void; step: (n: number) => void; S: { crops: { hp: number }[]; phase: string } };
      }).VR;
      VR.begin(1);
      VR.S.phase = 'wave';
      VR.S.crops.forEach((c) => {
        c.hp = 0;
      });
      VR.step(0.05);
    });
    await page.waitForFunction(() => document.getElementById('sEnd')?.classList.contains('show'));
    await expect(page.locator('#endTitle')).toHaveText('Garden Overrun');
  });

  test('campaign win screen', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      const VR = (window as unknown as { VR: { begin: (w: number) => void; end: (won: boolean) => void } }).VR;
      VR.begin(12);
      VR.end(true);
    });
    await page.waitForFunction(() => document.getElementById('sEnd')?.classList.contains('show'));
    await expect(page.locator('#endTitle')).toHaveText('The Ridge Holds!');
  });

  test('shop stays behind the parental gate', async ({ page }) => {
    await boot(page);
    await page.locator('#bStore').click();
    await expect(page.locator('#sGate')).toHaveClass(/show/);
    await expect(page.locator('#sStore')).not.toHaveClass(/show/);
    await page.evaluate(() => {
      (document.getElementById('gateA') as HTMLInputElement).value = '1';
      document.getElementById('gateGo')?.click();
    });
    await expect(page.locator('#gateMsg')).toHaveText('Not quite. Ask a grown-up for help.');
    await expect(page.locator('#sStore')).not.toHaveClass(/show/);
    await answerGate(page);
    await expect(page.locator('#sStore')).toHaveClass(/show/);
    await expect(page.locator('#sStore')).toContainText('Nothing on this screen charges a card');
    await expect(page.locator('#sStore')).toContainText('Season 1');
  });

  test('settings: sound, haptics, and theme', async ({ page }) => {
    await boot(page);
    await page.locator('#bSet').click();
    await expect(page.locator('#sSet')).toHaveClass(/show/);
    await expect(page.locator('#bHap')).toHaveText('On');
    await page.locator('#bHap').click();
    await expect(page.locator('#bHap')).toHaveText('Off');
    await page.locator('#bThemeLight').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('#bThemeDark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => {
      const el = document.getElementById('musicS') as HTMLInputElement | null;
      if (!el) return;
      el.value = '12';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.locator('#sSet [data-close]').click();
    await expect(page.locator('#sTitle')).toHaveClass(/show/);
    const saved = await page.evaluate(() => ({
      hap: localStorage.getItem('vr_hap'),
      music: localStorage.getItem('vr_music'),
      theme: localStorage.getItem('vr.theme'),
    }));
    expect(saved.hap).toBe('false');
    expect(saved.music).toBe('12');
    expect(saved.theme).toBe('dark');
  });
});
