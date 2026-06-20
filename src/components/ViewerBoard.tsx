import React from "react";
import { BoardState } from "../board/boardTypes";
import { DisplayBoard } from "./DisplayBoard";

interface Props {
  boardState: BoardState;
}

// Read-only. No pointer handlers for drawing. No toolbar.
export const ViewerBoard: React.FC<Props> = ({ boardState }) => {
  return (
    <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <DisplayBoard boardState={boardState} showActiveHighlight={false} />
    </div>
  );
};
