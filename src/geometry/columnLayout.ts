import { LOGICAL_WIDTH, LOGICAL_HEIGHT, MIN_COLUMN_WIDTH } from "../board/boardTypes";

export interface ColumnLayout {
  columnWidth: number;   // CSS px
  columnHeight: number;  // CSS px
  scale: number;         // CSS px per logical unit
  columnLeft: number[];  // CSS px - left edge of each column
  columnTop: number[];   // CSS px - top edge of each column
}

export function calculateDisplayColumnLayout(
  boardWidthCss: number,
  boardHeightCss: number,
  columnCount: number,
  logicalWidth = LOGICAL_WIDTH,
  logicalHeight = LOGICAL_HEIGHT
): ColumnLayout {
  const aspect = logicalHeight / logicalWidth; // 1.8

  const horizontalMargin = 0;  // CSS px each side
  const verticalMargin = 0;    // CSS px each side
  const gap = 0;               // CSS px between columns (divider line drawn separately)

  const availableWidth = boardWidthCss - horizontalMargin * 2 - gap * (columnCount - 1);
  const availableHeight = boardHeightCss - verticalMargin * 2;

  const maxWidthPerCol = availableWidth / columnCount;
  const maxHeightCol = availableHeight / aspect;
  // column width is constrained by both available width and available height
  let columnWidth = Math.min(maxWidthPerCol, maxHeightCol);
  columnWidth = Math.max(columnWidth, MIN_COLUMN_WIDTH);

  const columnHeight = columnWidth * aspect;
  const scale = columnWidth / logicalWidth;

  const totalWidth = columnWidth * columnCount + gap * (columnCount - 1);
  const startX = (boardWidthCss - totalWidth) / 2;
  const startY = (boardHeightCss - columnHeight) / 2;

  const columnLeft: number[] = [];
  const columnTop: number[] = [];
  for (let i = 0; i < columnCount; i++) {
    columnLeft.push(startX + i * (columnWidth + gap));
    columnTop.push(startY);
  }

  return { columnWidth, columnHeight, scale, columnLeft, columnTop };
}

export function calculateTeacherCanvasLayout(
  containerWidthCss: number,
  containerHeightCss: number,
  logicalWidth = LOGICAL_WIDTH,
  logicalHeight = LOGICAL_HEIGHT
): { canvasWidth: number; canvasHeight: number; offsetX: number; offsetY: number; scale: number } {
  const aspect = logicalHeight / logicalWidth;
  let canvasWidth = containerWidthCss;
  let canvasHeight = canvasWidth * aspect;
  if (canvasHeight > containerHeightCss) {
    canvasHeight = containerHeightCss;
    canvasWidth = canvasHeight / aspect;
  }
  const offsetX = (containerWidthCss - canvasWidth) / 2;
  const offsetY = (containerHeightCss - canvasHeight) / 2;
  const scale = canvasWidth / logicalWidth;
  return { canvasWidth, canvasHeight, offsetX, offsetY, scale };
}
