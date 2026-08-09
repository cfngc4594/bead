import { expect, type Locator, type Page, test } from "@playwright/test";

type ViewportCase = {
  expectedLayout: "desktop" | "mobile";
  height: number;
  name: string;
  width: number;
};

const viewportCases: ViewportCase[] = [
  {
    expectedLayout: "mobile",
    height: 844,
    name: "iPhone 390 x 844",
    width: 390,
  },
  {
    expectedLayout: "mobile",
    height: 667,
    name: "small iPhone 375 x 667",
    width: 375,
  },
  {
    expectedLayout: "desktop",
    height: 1180,
    name: "iPad 820 x 1180",
    width: 820,
  },
];

const steps = [
  {
    selector: '[data-onboarding="editor-canvas"]',
    title: "先认识画布",
  },
  {
    selector: (layout: ViewportCase["expectedLayout"]) =>
      `[data-onboarding="editor-tools-${layout}"]`,
    title: "选择创作工具",
  },
  {
    selector: (layout: ViewportCase["expectedLayout"]) =>
      `[data-onboarding="editor-colors-${layout}"]`,
    title: "挑一颗喜欢的豆",
  },
  {
    selector: '[data-onboarding="editor-toolbar"]',
    title: "完成与分享",
  },
] as const;

for (const viewportCase of viewportCases) {
  test(`${viewportCase.name} keeps the complete onboarding tour in view`, async ({
    page,
  }) => {
    await page.setViewportSize({
      height: viewportCase.height,
      width: viewportCase.width,
    });
    await createLocalProject(page);

    const expectedLayoutTarget = page.locator(
      `[data-onboarding="editor-tools-${viewportCase.expectedLayout}"]`,
    );
    const unexpectedLayout =
      viewportCase.expectedLayout === "mobile" ? "desktop" : "mobile";
    const unexpectedLayoutTarget = page.locator(
      `[data-onboarding="editor-tools-${unexpectedLayout}"]`,
    );

    await expect(expectedLayoutTarget).toBeVisible();
    await expect(unexpectedLayoutTarget).toBeHidden();

    for (const [index, step] of steps.entries()) {
      const dialog = page.locator(
        `[role="dialog"][data-joyride-step="${index}"]`,
      );
      const selector =
        typeof step.selector === "function"
          ? step.selector(viewportCase.expectedLayout)
          : step.selector;

      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("heading", { name: step.title }),
      ).toBeVisible();
      await expect(page.locator(selector)).toBeVisible();
      await expect(
        page.locator('[data-testid="spotlight"] path').nth(1),
      ).toHaveAttribute("d", /^M/);
      await expectTourToFitViewport(page, dialog);

      if (index < steps.length - 1) {
        await dialog
          .getByRole("button", { exact: true, name: "下一步" })
          .click();
      } else {
        await dialog
          .getByRole("button", { exact: true, name: "开始创作" })
          .click();
      }
    }

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
}

test("an active tour restarts and retargets across the mobile breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await createLocalProject(page);

  const firstDialog = page.locator('[role="dialog"][data-joyride-step="0"]');
  await expect(firstDialog).toBeVisible();
  await firstDialog
    .getByRole("button", { exact: true, name: "下一步" })
    .click();

  const toolsDialog = page.locator('[role="dialog"][data-joyride-step="1"]');
  const mobileTools = page.locator('[data-onboarding="editor-tools-mobile"]');
  const desktopTools = page.locator('[data-onboarding="editor-tools-desktop"]');

  await expect(toolsDialog).toBeVisible();
  await expect(mobileTools).toBeVisible();
  await expect(desktopTools).toBeHidden();

  await page.setViewportSize({ height: 390, width: 844 });
  await expect(desktopTools).toBeVisible();
  await expect(mobileTools).toBeHidden();
  await expect(firstDialog).toBeVisible();
  await expectTourToFitViewport(page, firstDialog);
  await firstDialog
    .getByRole("button", { exact: true, name: "下一步" })
    .click();
  await expect(toolsDialog).toBeVisible();
  await expect(desktopTools).toBeVisible();
  await expectTourToFitViewport(page, toolsDialog);

  await page.setViewportSize({ height: 844, width: 390 });
  await expect(mobileTools).toBeVisible();
  await expect(desktopTools).toBeHidden();
  await expect(firstDialog).toBeVisible();
  await expectTourToFitViewport(page, firstDialog);
  await firstDialog
    .getByRole("button", { exact: true, name: "下一步" })
    .click();
  await expect(toolsDialog).toBeVisible();
  await expect(mobileTools).toBeVisible();
  await expectTourToFitViewport(page, toolsDialog);
});

async function createLocalProject(page: Page) {
  await page.goto("/projects/new");
  await page.getByRole("button", { exact: true, name: "开始创作" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.locator('[data-onboarding="editor-canvas"]')).toBeVisible();
}

async function expectTourToFitViewport(page: Page, dialog: Locator) {
  await expect.poll(() => dialog.boundingBox()).not.toBeNull();

  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (!(box && viewport)) {
    return;
  }

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

  await expectNoHorizontalOverflow(page);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));

  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}
