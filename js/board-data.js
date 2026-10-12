// Components laid out on the board before the draft, summarised from the rulebook
// (setup steps 2–8 and Appendices III, VI, VIII and IX). `sprite` is the cell index
// in Board Game Arena's sprite sheet for that kind of tile.

// `building` is used to keep the Final Round Score tile from repeating the Round 6
// building; `noLate` marks the tile that may not go in the Round 5 or 6 space.
export const ROUND_SCORES = [
  { id: 'rs1', sprite: 0, discipline: 'law', text: 'Each Innovation you take: 5 points. End of round: 3 power per 2 Law.' },
  { id: 'rs2', sprite: 1, discipline: 'law', building: 'guild', text: 'Each Guild: 3 points. End of round: 1 Book per 3 Law.' },
  { id: 'rs3', sprite: 2, discipline: 'law', building: 'workshop', text: 'Each Workshop: 2 points. End of round: 1 Scholar per 3 Law.' },
  { id: 'rs4', sprite: 3, discipline: 'engineering', noLate: true, text: 'Each Spade spent: 2 points. End of round: 1 Coin per Engineering Level.' },
  { id: 'rs5', sprite: 4, discipline: 'medicine', text: 'Each Level advanced on the Science display: 1 point. End of round: 1 Book per 3 Medicine.' },
  { id: 'rs6', sprite: 5, discipline: 'engineering', text: 'Each City tile: 5 points. End of round: 1 Spade per 4 Engineering.' },
  { id: 'rs7', sprite: 6, discipline: 'medicine', building: 'palace-university', text: 'Each Palace or University: 5 points. End of round: 1 Tool per 2 Medicine.' },
  { id: 'rs8', sprite: 7, discipline: 'engineering', text: 'Each Sailing or Terraforming advance: 3 points. End of round: 1 Scholar per 3 Engineering.' },
  { id: 'rs9', sprite: 8, discipline: 'medicine', building: 'guild', text: 'Each Guild: 3 points. End of round: 1 Spade per 4 Medicine.' },
  { id: 'rs10', sprite: 9, discipline: 'banking', building: 'school', text: 'Each School: 4 points. End of round: 1 Coin per Banking Level.' },
  { id: 'rs11', sprite: 10, discipline: 'banking', building: 'palace-university', text: 'Each Palace or University: 5 points. End of round: 1 Tool per 2 Banking.' },
  { id: 'rs12', sprite: 11, discipline: 'banking', building: 'workshop', text: 'Each Workshop: 2 points. End of round: 4 power per 3 Banking.' },
];

// Final Round Score tiles share the Round Score sprite sheet. Each is drawn on the
// right part of its cell, so it covers the Science Bonus of the Round 6 tile.
export const FINAL_SCORES = [
  { id: 'fs1', sprite: 12, building: 'school', text: 'Round 6: each School: 4 points.' },
  { id: 'fs2', sprite: 13, building: 'guild', text: 'Round 6: each Guild: 3 points.' },
  { id: 'fs3', sprite: 14, building: 'workshop', text: 'Round 6: each Workshop on a border hex: 3 points.' },
  { id: 'fs4', sprite: 15, building: 'workshop', text: 'Round 6: each Workshop: 2 points.' },
];

export const BOOK_ACTIONS = [
  { id: 'ba1', sprite: 0, text: '1 Book: advance 2 Levels in one Discipline.' },
  { id: 'ba2', sprite: 1, text: '2 Books: upgrade a Workshop to a Guild.' },
  { id: 'ba3', sprite: 2, text: '2 Books: 2 points per Guild.' },
  { id: 'ba4', sprite: 3, text: '2 Books: 6 Coins.' },
  { id: 'ba5', sprite: 4, text: '1 Book: 5 power.' },
  { id: 'ba6', sprite: 5, text: '3 Books: Terraform and Build with 3 Spades.' },
];

// Sprite cell 2 of the innovation sheet is blank.
export const INNOVATIONS = [
  { id: 'architecture', name: 'Architecture', sprite: 0, text: 'Immediately: advance 1 Level per different building shape you have on the board, and gain 10 points.' },
  { id: 'census', name: 'Census', sprite: 1, text: 'Immediately: 8 / 12 / 18 points for 7–8 / 9–10 / 11+ buildings.' },
  { id: 'communications', name: 'Communications', sprite: 3, text: 'Immediately: 8 / 12 / 18 points for 4 / 5 / 6+ building groups.' },
  { id: 'league', name: 'League of Cities', sprite: 4, text: 'Immediately: 5 points per City tile.' },
  { id: 'sewerage', name: 'Sewerage', sprite: 5, text: 'Immediately: 2 points per Workshop.' },
  { id: 'steam', name: 'Steam Power', sprite: 6, text: 'Immediately: 1 Scholar, 1 free Terraforming advance and 1 free Sailing advance.' },
  { id: 'professors', name: 'Professors', sprite: 7, text: 'Action: gain 1 Scholar and 3 points.' },
  { id: 'trading', name: 'Trading Routes', sprite: 8, text: 'When you Pass: 2 points per Guild.' },
  { id: 'colleges', name: 'Colleges', sprite: 9, text: 'Immediately: 5 points per School.' },
  { id: 'workshop', name: 'Workshop', sprite: 10, text: 'Immediately: build a Neutral Workshop. Income: 3 Tools.' },
  { id: 'guilds', name: 'Guilds', sprite: 11, text: 'Immediately: build a Neutral Guild. Income: 5 Coins.' },
  { id: 'schools', name: 'Schools', sprite: 12, text: 'Immediately: build a Neutral School and gain 1 Competency tile.' },
  { id: 'university', name: 'University', sprite: 13, text: 'Immediately: build a Neutral University (no Competency tile; it founds a City with only 3 buildings). Income: 2 points.' },
  { id: 'palace', name: 'Palace', sprite: 14, text: 'Immediately: build a Neutral Palace (no Palace tile) and add 2 power to Bowl III. Income: 4 power.' },
  { id: 'monument', name: 'Monument', sprite: 15, text: 'Immediately: build a Neutral Monument (Power value 4; founds a City with only 2 buildings) and gain 7 points.' },
  { id: 'libraries', name: 'Libraries', sprite: 16, text: 'Immediately: 1 point per Level in your two highest Disciplines.' },
  { id: 'steel', name: 'Steel', sprite: 17, text: 'Immediately: 8 / 12 / 18 points for 1 / 2 / 3 Bridges.' },
  { id: 'deus', name: 'Deus Ex Machina', sprite: 18, text: 'Action: Terraform and Build with 1 free Spade. Immediately: 1 Book of choice and +1 Level in each Discipline.' },
];

export const COMPETENCIES = [
  { id: 'tower', sprite: 0, text: 'Immediately: build a Neutral Tower. Income: 2 power and 2 Coins.' },
  { id: 'annexes', sprite: 1, text: 'Immediately: 2 Neutral Annexes. Action: place an Annex next to a building (+1 Power value).' },
  { id: 'power', sprite: 2, text: 'Action: gain 4 power.' },
  { id: 'lowest', sprite: 3, text: 'When you Pass: 1 point per Level in your lowest Discipline.' },
  { id: 'cities', sprite: 4, text: 'When you Pass: 2 points per City tile.' },
  { id: 'spades', sprite: 5, text: 'Immediately: Terraform and Build with 2 free Spades.' },
  { id: 'book', sprite: 6, text: 'Income: 1 Book of choice and 1 power.' },
  { id: 'scholar', sprite: 7, text: 'Whenever you Send a Scholar: 2 points.' },
  { id: 'points', sprite: 8, text: 'Income: 3 points and 2 Coins.' },
  { id: 'border', sprite: 9, text: 'Whenever you build a Workshop on a border hex: 3 points.' },
  { id: 'bonus', sprite: 10, text: 'Immediately: 1 Tool, 5 points and 2 Coins.' },
  { id: 'science', sprite: 11, text: 'Income: 1 Tool and advance 1 Level in a Discipline.' },
];

export const BOARD_ITEMS = {
  roundScores: ROUND_SCORES,
  finalScores: FINAL_SCORES,
  bookActions: BOOK_ACTIONS,
  innovations: INNOVATIONS,
  competencies: COMPETENCIES,
};

export const BOARD_SPRITES = {
  roundScores: { file: 'scoring_tiles.png', cols: 17, rows: 1, aspect: (2000 / 17) / 67 },
  finalScores: { file: 'scoring_tiles.png', cols: 17, rows: 1, aspect: (2000 / 17) / 67 },
  bookActions: { file: 'knowledge_actions.png', cols: 6, rows: 1, aspect: (2000 / 6) / 182 },
  innovations: { file: 'invention_tiles.jpg', cols: 19, rows: 1, aspect: (2000 / 19) / 64 },
  competencies: { file: 'favor_tiles.png', cols: 12, rows: 1, aspect: 120 / 117 },
};

export const innovationCount = (players) => 2 * players + 2;

// Board images and where tiles sit on them, in pixels of the image as measured.
// Boxes are { x, y, w }; the height follows from the tile's aspect ratio.
// Round 1 is the bottom Round Score space, Round 6 the top.
const GAME_BOARD_3_5 = {
  file: 'game_board.jpg',
  width: 2000,
  height: 1282,
  rounds: [1023, 899, 774, 649, 524, 399].map((y) => ({ x: 31, y, w: 200 })),
  bookActions: [22, 236, 450].map((x) => ({ x, y: 1164, w: 190 })),
};

const GAME_BOARD_1_3 = {
  file: 'game_board_2p.jpg',
  width: 2000,
  height: 1282,
  rounds: [1033, 906, 780, 653, 527, 400].map((y) => ({ x: 37, y, w: 204 })),
  bookActions: [22, 238, 452].map((x) => ({ x, y: 1162, w: 190 })),
};

// The 2-player game uses the 1–3 player side; 3 players use the recommended 3–5 side.
export const gameBoardFor = (players) => (players <= 2 ? GAME_BOARD_1_3 : GAME_BOARD_3_5);
export const GAME_BOARDS = [GAME_BOARD_1_3, GAME_BOARD_3_5];

export const COMPETENCY_BOARD = {
  file: 'competency_board.jpg',
  width: 850,
  height: 480,
  // Left to right by Discipline (Banking, Law, Engineering, Medicine), top to bottom.
  slots: [80, 290, 502, 714].flatMap((x) => [92, 216, 341].map((y) => ({ x, y, w: 108 }))),
};

// Innovation display sections above the base section, by player count. Even
// player counts start with a row of 2 tiles that each span 2 Disciplines.
const INNOVATION_COLUMNS = [20, 233, 446, 659];
const innovationRow = (y) => INNOVATION_COLUMNS.map((x) => ({ x, y, w: 172 }));
const spanningRow = [{ x: 127, y: 53, w: 172 }, { x: 551, y: 53, w: 172 }];

export const INNOVATION_BOARDS = {
  2: { file: 'invention_board_2.jpg', width: 850, height: 423, slots: [...spanningRow, ...innovationRow(287)] },
  3: { file: 'invention_board_3.jpg', width: 850, height: 423, slots: [...innovationRow(133), ...innovationRow(283)] },
  4: { file: 'invention_board_4.jpg', width: 850, height: 564, slots: [...spanningRow, ...innovationRow(287), ...innovationRow(433)] },
  5: { file: 'invention_board_5.jpg', width: 850, height: 564, slots: [133, 283, 433].flatMap(innovationRow) },
};
