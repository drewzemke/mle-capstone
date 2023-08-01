export type Size = {
  width: number;
  height: number;
};

export type Box = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type LabeledBox = { box: Box; label: string; score: number };

export type ClassificationScore = {
  label: string;
  score: number;
};

export type ClassificationResults = {
  best: ClassificationScore;
  scores: ClassificationScore[];
};
