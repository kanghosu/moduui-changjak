export const CELL_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
] as const;

export const WORD_NUMBERS = [1, 2, 3, 4] as const;
export const ANCHOR_CELLS = [7, 13, 19] as const;
export const ANTAGONIST_CELLS = [9, 14, 18] as const;
export const BSTORY_CELLS = [8, 15, 22] as const;

export type CellNumber = (typeof CELL_NUMBERS)[number];
