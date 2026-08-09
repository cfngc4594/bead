import type { ProductTourStep } from "@/features/onboarding/lib/product-tour";

export function getEditorOnboardingSteps(isMobile: boolean): ProductTourStep[] {
  const layout = isMobile ? "mobile" : "desktop";

  return [
    {
      content: "这里是拼豆画布。双指或滚轮缩放，拖动画布查看细节。",
      placement: "bottom",
      selector: '[data-onboarding="editor-canvas"]',
      title: "先认识画布",
    },
    {
      content: "画笔负责放豆，橡皮可以擦除；还可以移动、框选、混豆和吸取颜色。",
      placement: "top",
      selector: `[data-onboarding="editor-tools-${layout}"]`,
      title: "选择创作工具",
    },
    {
      content: "按色号挑选 MARD 拼豆颜色。当前颜色会显示在色板上方。",
      placement: isMobile ? "top" : "left",
      selector: `[data-onboarding="editor-colors-${layout}"]`,
      title: "挑一颗喜欢的豆",
    },
    {
      content:
        "顶部可以撤销、3D 预览、从图片生成豆图，以及导入或导出作品。随时点问号重播引导。",
      placement: "bottom",
      selector: '[data-onboarding="editor-toolbar"]',
      title: "完成与分享",
    },
  ];
}
