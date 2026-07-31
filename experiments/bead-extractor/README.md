# Bead Extractor Experiment

这是一个与主工程隔离的 Python 实验项目，用纯图像处理从轴对齐的拼豆导出图恢复
MARD 拼豆工程文件。程序不使用 OCR，也不读取标题、格内色号或图例文字。

## 当前处理流程

1. 在 Lab 色差梯度上估计单格周期。横纵投影共同约束周期，但不假设网格为正方形。
2. 用低分位连续性投影抑制格内字符和人物轮廓，再由正交方向的网格梳确定完整外框。
3. 对每一条横线和竖线运行多卡尺测量；线中心近似等距，但每条线受色带、抗锯齿和
   压缩共同影响的有效宽度、覆盖率和置信度独立保存。分离的左右梯度边缘会作为一个
   完整污染带测量；算法不知道也不需要知道粗线每隔多少格出现。
4. 如果检测到画布外围坐标栏，按外观证据去掉一圈坐标格；不读取其中的数字。
5. 按测得的四边线宽建立逐格可信区域。源像素按像素中心唯一归属，不让相邻格共享
   同一条边界像素；格内用颜色密度和二维覆盖率寻找底色，避开中央模糊文字。
6. 从外围格学习双亮度棋盘纹理，把透明背景输出为 `null`。没有固定“白色等于空格”
   的规则。
7. 自动比较 221 色和 264 色配置。若图下存在可靠的等宽色表，只检测色块和排列，
   不识别文字；图中实测色块会限制活动颜色并经全图稳健样本迭代校准。
8. 规范化等价色号，当前规则为 `R11 -> Q4`，最终输出一维行优先矩阵。

除图片无法读取、完全找不到数学意义上的周期网格等无法继续的情况外，所有阶段都会
继续运行。尺寸上限、低网格置信度、色表歧义和颜色低置信度只写入最终 `warnings`，
不会阻止 `result.json` 生成。

## 安装与运行

```bash
cd experiments/bead-extractor
uv sync

uv run bead-extract samples/xiadie.JPG \
  --output output/xiadie \
  --palette auto

uv run bead-extract samples/hutao.JPG \
  --output output/hutao \
  --palette auto
```

### 冻结基线与实验路径

空格判断有两条显式隔离的路径：

- `baseline`（默认）：冻结的 `checker-mixture-v1`。它直接使用原棋盘混合模型的
  空格结果，不执行任何后分类恢复。
- `conflict-aware`：独立实验路径。当前包含“活动色与空格发生批量冲突时恢复豆子”
  的实验规则；修改该模块不会改变基线分支。

单独运行某条路径：

```bash
uv run bead-extract samples/huohua.JPG \
  --output output/huohua-baseline \
  --palette 264 \
  --empty-strategy baseline

uv run bead-extract samples/huohua.JPG \
  --output output/huohua-conflict-aware \
  --palette 264 \
  --empty-strategy conflict-aware
```

一次生成两套结果并逐格比较：

```bash
uv run bead-extract samples/huohua.JPG \
  --output output/huohua-empty-compare \
  --palette 264 \
  --empty-strategy compare
```

比较目录包含 `baseline/`、`conflict-aware/` 和 `comparison.json`。差异文件记录
零基行列坐标、两侧格值，以及 `emptyToBead`、`beadToEmpty`、`colorChanged` 统计。
基线的版本名同时写入每份 `report.json` 的 `emptyCells.decision`，避免后续结果混淆。

`--palette` 支持 `auto`、`221`、`264` 和 `291`。`auto` 会比较 221/264；291 目前需
显式指定。诊断阈值可以调整，但越界仍只产生警告：

```bash
uv run bead-extract INPUT.JPG \
  --max-rows 300 \
  --max-cols 300 \
  --max-cells 90000 \
  --min-cell-pitch 5 \
  --max-uncertain-fraction 0.005
```

输出目录包含：

- `result.json`：拼豆工程文件；`beads` 为 `rows * cols` 长的一维行优先数组，空格为
  `null`。可选的 `sourceGrid` 保存源图逐条横/竖线的有效宽度，供诊断渲染使用。
- `report.json`：网格、逐线测量摘要、色板选择、空格检测、颜色置信度和最终警告。
- `grid-overlay.png`：黄色为测得的线宽范围，青色为线中心，洋红色为低置信度线。
- `grid-line-mask.png`：实际用于排除边界污染的线掩码。
- `trusted-pixel-mask.png`：参与格子底色估计的像素。
- `empty-cell-mask.png`：检测到的透明/空格。
- `confidence-heatmap.png`：逐格颜色置信度。
- `reconstructed.png`：不绘制网格的规范色板重建图。
- `difference.png`：仅在可信像素位置计算的重建差异。

工程 JSON 可以再次渲染为 PNG：

```bash
uv run bead-render output/xiadie/result.json \
  --output output/xiadie/rendered-clean.png \
  --width 1440 --height 1440

uv run bead-render output/xiadie/result.json \
  --output output/xiadie/rendered-grid.png \
  --width 1440 --height 1440 --grid all
```

`--grid all` 和 `--grid major` 会把 `sourceGrid` 中每条线的测量宽度分别缩放到输出
尺寸，不再把所有线画成 1px；不含该字段的旧模板仍按 1px 渲染。

## 当前样图结果

- `xiadie.JPG`：自动定位 `93x81`，选择 221 色；检测到 23 个可靠图例色和 2,606
  个空格，输出 4,927 颗豆。图上可见的人工统计为 4,929 颗，因此当前空格检测仍有
  2 格偏差；程序本身不读取该统计。颜色集合为 23 色，13 个非空格颜色低置信度，
  网格的 15 条弱横线由等中心模型补全并写入警告。
- `hutao.JPG`：自动定位 `200x200`，选择 264 色并输出 40,000 格。底部图例是变宽的
  紧凑排版，等宽色表模型给出约 16 Delta E 的中位误差，因此被明确禁用。完整色板
  分类仍有 2,688 个低置信度格和可见的浅色条带；工程文件会生成，但不能视为已经
  准确恢复。

这两个结果刻意区分“可运行”和“可信”。缺少原始工程真值时，不通过减少颜色数或
邻域平滑来隐藏错误。算法调研、失败路线和判断依据见 [RESEARCH.md](RESEARCH.md)。

## 色板与测试

`data/mard_colors.json` 是实验使用的色板快照，明确保存 221、264、291 三套候选，
不会通过数组长度猜规格。从主工程重新同步时运行：

```bash
node scripts/export_palette.mjs
```

```bash
uv run ruff check src tests
uv run pytest -q
```
