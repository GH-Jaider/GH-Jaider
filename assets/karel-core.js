// src/karel.ts
var Direction = /* @__PURE__ */ ((Direction2) => {
  Direction2["North"] = "north";
  Direction2["West"] = "west";
  Direction2["South"] = "south";
  Direction2["East"] = "east";
  return Direction2;
})(Direction || {});
var DirectionVectors = {
  ["north" /* North */]: { x: 0, y: 1 },
  ["west" /* West */]: { x: -1, y: 0 },
  ["south" /* South */]: { x: 0, y: -1 },
  ["east" /* East */]: { x: 1, y: 0 }
};
var LeftTurnMap = {
  ["north" /* North */]: "west" /* West */,
  ["west" /* West */]: "south" /* South */,
  ["south" /* South */]: "east" /* East */,
  ["east" /* East */]: "north" /* North */
};
var RightTurnMap = {
  ["north" /* North */]: "east" /* East */,
  ["east" /* East */]: "south" /* South */,
  ["south" /* South */]: "west" /* West */,
  ["west" /* West */]: "north" /* North */
};
function parseDirection(value) {
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "north":
    case "n":
      return "north" /* North */;
    case "west":
    case "w":
      return "west" /* West */;
    case "south":
    case "s":
      return "south" /* South */;
    case "east":
    case "e":
      return "east" /* East */;
    default:
      throw new Error(`Invalid direction string: ${value}`);
  }
}
var Karel = class _Karel {
  _position;
  _facing;
  _beepersInBag;
  constructor(position = { x: 1, y: 1 }, facing = "north" /* North */, beepersInBag = 0) {
    this._position = { ...position };
    this._facing = facing;
    this._beepersInBag = beepersInBag;
  }
  /**
   * Current position of Karel.
   */
  get position() {
    return { ...this._position };
  }
  /**
   * Current X coordinate.
   */
  get x() {
    return this._position.x;
  }
  /**
   * Current Y coordinate.
   */
  get y() {
    return this._position.y;
  }
  /**
   * Current direction Karel is facing.
   */
  get facing() {
    return this._facing;
  }
  /**
   * Number of beepers in Karel's bag.
   */
  get beepersInBag() {
    return this._beepersInBag;
  }
  /**
   * Check if Karel has beepers in the bag.
   */
  hasBeepersInBag() {
    return this._beepersInBag > 0;
  }
  /**
   * Get the position in front of Karel.
   */
  frontPosition() {
    const vector = DirectionVectors[this._facing];
    return {
      x: this._position.x + vector.x,
      y: this._position.y + vector.y
    };
  }
  /**
   * Get the position to Karel's left.
   */
  leftPosition() {
    const leftDir = LeftTurnMap[this._facing];
    const vector = DirectionVectors[leftDir];
    return {
      x: this._position.x + vector.x,
      y: this._position.y + vector.y
    };
  }
  /**
   * Get the position to Karel's right.
   */
  rightPosition() {
    const rightDir = RightTurnMap[this._facing];
    const vector = DirectionVectors[rightDir];
    return {
      x: this._position.x + vector.x,
      y: this._position.y + vector.y
    };
  }
  /**
   * Move Karel forward one cell.
   * This only updates Karel's position - wall checking should be done by World.
   */
  move() {
    const front = this.frontPosition();
    this._position = front;
  }
  /**
   * Turn Karel 90° counter-clockwise.
   */
  turnLeft() {
    this._facing = LeftTurnMap[this._facing];
  }
  /**
   * Pick up a beeper (adds to bag).
   * World should verify beeper exists at position.
   */
  pickBeeper() {
    this._beepersInBag++;
  }
  /**
   * Put down a beeper (removes from bag).
   * Returns false if no beepers in bag.
   */
  putBeeper() {
    if (this._beepersInBag <= 0) {
      return false;
    }
    this._beepersInBag--;
    return true;
  }
  /**
   * Check if Karel is facing a specific direction.
   */
  isFacing(direction) {
    return this._facing === direction;
  }
  /**
   * Create a deep clone of Karel's current state.
   */
  clone() {
    return new _Karel(this._position, this._facing, this._beepersInBag);
  }
  /**
   * Serialize Karel state to JSON-compatible object.
   */
  toJSON() {
    return {
      x: this._position.x,
      y: this._position.y,
      facing: this._facing,
      beepers: this._beepersInBag
    };
  }
  /**
   * Create Karel from JSON-compatible object.
   */
  static fromJSON(data) {
    const facing = parseDirection(data.facing);
    return new _Karel({ x: data.x, y: data.y }, facing, data.beepers ?? 0);
  }
};

// src/messages.ts
var en = {
  // Runtime (error shutoffs)
  moveBlocked: () => "Karel hit a wall: the front is blocked",
  noBeepersToPickUp: (x, y) => `There is no beeper to pick up at square (${x}, ${y})`,
  noBeepersInBag: () => "Karel's beeper bag is empty",
  unknownInstruction: (name) => `Unknown instruction '${name}'`,
  unknownCondition: (name) => `Unknown condition '${name}'`,
  recursionTooDeep: (name) => `Instruction '${name}' calls itself too many times without stopping (infinite recursion?)`,
  maxIterationsReached: (max) => `Program stopped after ${max} steps: it looks like an infinite loop`,
  stuckWithoutProgress: () => "Program stopped: it loops forever without Karel doing anything (empty loop?)",
  programNotLoaded: () => "No program loaded",
  invalidWall: (x1, y1, x2, y2) => `Invalid wall: cells (${x1}, ${y1}) and (${x2}, ${y2}) are not adjacent`,
  // Map validation (.klm). These are collected, not thrown: validateKarelMap
  // reports everything wrong with a file in one pass, so each entry has to
  // stand on its own next to the others.
  mapNotAnObject: () => "The map must be a JSON object",
  missingDimensions: () => 'Missing "dimensions" ({ "width": ..., "height": ... })',
  invalidWidth: () => '"dimensions.width" must be a whole number of at least 1',
  widthTooLarge: (max) => `"dimensions.width" cannot be larger than ${max}`,
  invalidHeight: () => '"dimensions.height" must be a whole number of at least 1',
  heightTooLarge: (max) => `"dimensions.height" cannot be larger than ${max}`,
  missingKarel: () => 'Missing "karel" ({ "x": ..., "y": ..., "facing": ..., "beepers": ... })',
  invalidKarelPosition: () => '"karel.x" and "karel.y" must be whole numbers',
  karelOutOfBounds: (x, y, width, height) => `Karel is outside the world: (${x}, ${y}) in a ${width}x${height} world`,
  invalidKarelFacing: () => '"karel.facing" must be "north", "south", "east" or "west"',
  unknownKarelFacing: (value) => `"karel.facing" has an invalid value: "${value}"`,
  invalidKarelBeepers: () => '"karel.beepers" must be a whole number of 0 or more',
  beepersNotAnArray: () => '"beepers" must be an array',
  invalidBeeperEntry: (n) => `Beeper #${n} must look like { "x": 3, "y": 3, "count": 1 }`,
  beeperOutOfBounds: (n, x, y) => `Beeper #${n} is outside the world: (${x}, ${y})`,
  invalidBeeperCount: (n) => `Beeper #${n} must have a count of at least 1`,
  wallsNotAnArray: () => '"walls" must be an array',
  invalidWallEntry: (n) => `Wall #${n} must look like { "from": { "x": 4, "y": 3 }, "to": { "x": 4, "y": 4 } }`,
  wallOutOfBounds: (n) => `Wall #${n} touches a cell outside the world`,
  wallNotAdjacent: (n, x1, y1, x2, y2) => `Wall #${n}: cells (${x1}, ${y1}) and (${x2}, ${y2}) are not adjacent`,
  // Goals. Read by a student in the browser and by a marker on the command
  // line, so they are written for whoever is reading, not as a diff.
  goalDifferentSize: (w, h, ew, eh) => `the world is ${w}x${h} but the expected world is ${ew}x${eh}`,
  goalDifferentWallCount: (has, expected) => `the world has ${has} ${has === 1 ? "wall" : "walls"} but the expected world has ${expected}`,
  goalWallNotInExpected: (where) => `the world has a wall at ${where} that the expected world does not`,
  goalWrongCorner: (ex, ey, ax, ay) => `expected Karel at (${ex}, ${ey}), found (${ax}, ${ay})`,
  goalWrongFacing: (expected, found) => `expected Karel facing ${expected}, found ${found}`,
  goalWrongBag: (expected, found) => `expected ${expected} ${expected === 1 ? "beeper" : "beepers"} in the bag, found ${found}`,
  goalWrongPile: (expected, square, found) => `expected ${expected} ${expected === 1 ? "beeper" : "beepers"} at ${square}, found ${found}`,
  goalUnexpectedPile: (square, found) => `expected no beepers at ${square}, found ${found}`,
  // Parser
  emptyProgram: () => "The program is empty. Start with BEGINNING-OF-PROGRAM",
  missingProgramStart: () => "Missing BEGINNING-OF-PROGRAM at the start of the program",
  missingProgramEnd: () => "Missing END-OF-PROGRAM at the end of the program",
  missingExecutionStart: () => "Missing BEGINNING-OF-EXECUTION before the instructions",
  missingExecutionEnd: () => "Missing END-OF-EXECUTION after the instructions",
  missingTurnoff: () => "The program never calls 'turnoff'. Karel programs should end with turnoff;",
  expectedKeyword: (keyword, found) => `Expected ${keyword} but found '${found || "end of file"}'`,
  expectedInstructionName: () => "Expected an instruction name after DEFINE-NEW-INSTRUCTION",
  duplicateInstruction: (name) => `Instruction '${name}' is defined more than once; the last definition wins`,
  cannotRedefineBuiltIn: (name) => `Cannot redefine the built-in instruction '${name}'`,
  missingSemicolon: () => "Missing semicolon (;) after this instruction",
  unexpectedSemicolon: () => "Unexpected semicolon (;)",
  unexpectedToken: (value) => `Unexpected '${value || "end of file"}' here`,
  invalidIterateCount: () => "ITERATE needs a number, e.g. ITERATE 3 TIMES",
  contentAfterProgramEnd: () => "Unexpected content after END-OF-PROGRAM"
};
var es = {
  // Runtime (error shutoffs)
  moveBlocked: () => "Karel choc\xF3 contra un muro: el frente est\xE1 bloqueado",
  noBeepersToPickUp: (x, y) => `No hay ning\xFAn zumbador que recoger en la casilla (${x}, ${y})`,
  noBeepersInBag: () => "La mochila de Karel est\xE1 vac\xEDa",
  unknownInstruction: (name) => `La instrucci\xF3n '${name}' no existe`,
  unknownCondition: (name) => `La condici\xF3n '${name}' no existe`,
  recursionTooDeep: (name) => `La instrucci\xF3n '${name}' se llama a s\xED misma sin parar (\xBFrecursi\xF3n infinita?)`,
  maxIterationsReached: (max) => `El programa se detuvo tras ${max} pasos: parece un bucle infinito`,
  stuckWithoutProgress: () => "El programa se detuvo: da vueltas para siempre sin que Karel haga nada (\xBFbucle vac\xEDo?)",
  programNotLoaded: () => "No hay ning\xFAn programa cargado",
  invalidWall: (x1, y1, x2, y2) => `Muro inv\xE1lido: las celdas (${x1}, ${y1}) y (${x2}, ${y2}) no son adyacentes`,
  // Map validation (.klm)
  mapNotAnObject: () => "El mapa debe ser un objeto JSON",
  missingDimensions: () => 'Falta "dimensions" ({ "width": ..., "height": ... })',
  invalidWidth: () => '"dimensions.width" debe ser un n\xFAmero entero de al menos 1',
  widthTooLarge: (max) => `"dimensions.width" no puede ser mayor que ${max}`,
  invalidHeight: () => '"dimensions.height" debe ser un n\xFAmero entero de al menos 1',
  heightTooLarge: (max) => `"dimensions.height" no puede ser mayor que ${max}`,
  missingKarel: () => 'Falta "karel" ({ "x": ..., "y": ..., "facing": ..., "beepers": ... })',
  invalidKarelPosition: () => '"karel.x" y "karel.y" deben ser n\xFAmeros enteros',
  karelOutOfBounds: (x, y, width, height) => `Karel est\xE1 fuera del mundo: (${x}, ${y}) en un mundo de ${width}x${height}`,
  invalidKarelFacing: () => '"karel.facing" debe ser "north", "south", "east" o "west"',
  unknownKarelFacing: (value) => `"karel.facing" tiene un valor inv\xE1lido: "${value}"`,
  invalidKarelBeepers: () => '"karel.beepers" debe ser un n\xFAmero entero de 0 o m\xE1s',
  beepersNotAnArray: () => '"beepers" debe ser una lista',
  invalidBeeperEntry: (n) => `El zumbador n.\xBA ${n} debe ser { "x": 3, "y": 3, "count": 1 }`,
  beeperOutOfBounds: (n, x, y) => `El zumbador n.\xBA ${n} est\xE1 fuera del mundo: (${x}, ${y})`,
  invalidBeeperCount: (n) => `El zumbador n.\xBA ${n} debe tener una cantidad de al menos 1`,
  wallsNotAnArray: () => '"walls" debe ser una lista',
  invalidWallEntry: (n) => `El muro n.\xBA ${n} debe ser { "from": { "x": 4, "y": 3 }, "to": { "x": 4, "y": 4 } }`,
  wallOutOfBounds: (n) => `El muro n.\xBA ${n} toca una celda fuera del mundo`,
  wallNotAdjacent: (n, x1, y1, x2, y2) => `Muro n.\xBA ${n}: las celdas (${x1}, ${y1}) y (${x2}, ${y2}) no son adyacentes`,
  // Goals
  goalDifferentSize: (w, h, ew, eh) => `el mundo es de ${w}x${h} pero el esperado es de ${ew}x${eh}`,
  goalDifferentWallCount: (has, expected) => `el mundo tiene ${has} ${has === 1 ? "muro" : "muros"} pero el esperado tiene ${expected}`,
  goalWallNotInExpected: (where) => `el mundo tiene un muro en ${where} que el esperado no tiene`,
  goalWrongCorner: (ex, ey, ax, ay) => `se esperaba a Karel en (${ex}, ${ey}), est\xE1 en (${ax}, ${ay})`,
  goalWrongFacing: (expected, found) => `se esperaba a Karel mirando al ${expected}, mira al ${found}`,
  goalWrongBag: (expected, found) => `se esperaban ${expected} ${expected === 1 ? "zumbador" : "zumbadores"} en la mochila, hay ${found}`,
  goalWrongPile: (expected, square, found) => `se esperaban ${expected} ${expected === 1 ? "zumbador" : "zumbadores"} en ${square}, hay ${found}`,
  goalUnexpectedPile: (square, found) => `no se esperaba ning\xFAn zumbador en ${square}, hay ${found}`,
  // Parser
  emptyProgram: () => "El programa est\xE1 vac\xEDo. Empieza con BEGINNING-OF-PROGRAM",
  missingProgramStart: () => "Falta BEGINNING-OF-PROGRAM al principio del programa",
  missingProgramEnd: () => "Falta END-OF-PROGRAM al final del programa",
  missingExecutionStart: () => "Falta BEGINNING-OF-EXECUTION antes de las instrucciones",
  missingExecutionEnd: () => "Falta END-OF-EXECUTION despu\xE9s de las instrucciones",
  missingTurnoff: () => "El programa nunca llama a 'turnoff'. Un programa de Karel deber\xEDa terminar con turnoff;",
  expectedKeyword: (keyword, found) => `Se esperaba ${keyword} pero se encontr\xF3 '${found || "el final del archivo"}'`,
  expectedInstructionName: () => "Se esperaba el nombre de una instrucci\xF3n despu\xE9s de DEFINE-NEW-INSTRUCTION",
  duplicateInstruction: (name) => `La instrucci\xF3n '${name}' est\xE1 definida m\xE1s de una vez; vale la \xFAltima definici\xF3n`,
  cannotRedefineBuiltIn: (name) => `No se puede redefinir la instrucci\xF3n b\xE1sica '${name}'`,
  missingSemicolon: () => "Falta un punto y coma (;) despu\xE9s de esta instrucci\xF3n",
  unexpectedSemicolon: () => "Punto y coma (;) inesperado",
  unexpectedToken: (value) => `'${value || "el final del archivo"}' no puede ir aqu\xED`,
  invalidIterateCount: () => "ITERATE necesita un n\xFAmero, por ejemplo ITERATE 3 TIMES",
  contentAfterProgramEnd: () => "Hay contenido despu\xE9s de END-OF-PROGRAM"
};
var CATALOGUES = { en, es };
var locale = "en";
function setLocale(next) {
  locale = next;
}
function getLocale() {
  return locale;
}
var ErrorMessages = Object.fromEntries(
  Object.keys(en).map((key) => [
    key,
    (...args) => CATALOGUES[locale][key](...args)
  ])
);

// src/types/errors.ts
var RuntimeError = class extends Error {
  constructor(message, line, kind = "internal") {
    super(message);
    this.line = line;
    this.kind = kind;
    this.name = "RuntimeError";
  }
  line;
  kind;
};

// src/world.ts
var MAX_WORLD_SIZE = 100;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isInt(value) {
  return typeof value === "number" && Number.isInteger(value);
}
function validateKarelMap(data) {
  const errors = [];
  if (!isRecord(data)) {
    return { ok: false, errors: [ErrorMessages.mapNotAnObject()] };
  }
  let width = 0;
  let height = 0;
  if (!isRecord(data.dimensions)) {
    errors.push(ErrorMessages.missingDimensions());
  } else {
    if (!isInt(data.dimensions.width) || data.dimensions.width < 1) {
      errors.push(ErrorMessages.invalidWidth());
    } else if (data.dimensions.width > MAX_WORLD_SIZE) {
      errors.push(ErrorMessages.widthTooLarge(MAX_WORLD_SIZE));
    } else {
      width = data.dimensions.width;
    }
    if (!isInt(data.dimensions.height) || data.dimensions.height < 1) {
      errors.push(ErrorMessages.invalidHeight());
    } else if (data.dimensions.height > MAX_WORLD_SIZE) {
      errors.push(ErrorMessages.heightTooLarge(MAX_WORLD_SIZE));
    } else {
      height = data.dimensions.height;
    }
  }
  const inBounds = (x, y) => width > 0 && height > 0 && x >= 1 && x <= width && y >= 1 && y <= height;
  let karel = null;
  if (!isRecord(data.karel)) {
    errors.push(ErrorMessages.missingKarel());
  } else {
    const k = data.karel;
    if (!isInt(k.x) || !isInt(k.y)) {
      errors.push(ErrorMessages.invalidKarelPosition());
    } else if (width > 0 && height > 0 && !inBounds(k.x, k.y)) {
      errors.push(ErrorMessages.karelOutOfBounds(k.x, k.y, width, height));
    }
    let facing = "north";
    if (typeof k.facing !== "string") {
      errors.push(ErrorMessages.invalidKarelFacing());
    } else {
      try {
        facing = parseDirection(k.facing);
      } catch {
        errors.push(ErrorMessages.unknownKarelFacing(k.facing));
      }
    }
    const beepers2 = k.beepers === void 0 ? 0 : k.beepers;
    if (!isInt(beepers2) || beepers2 < 0) {
      errors.push(ErrorMessages.invalidKarelBeepers());
    }
    if (isInt(k.x) && isInt(k.y) && isInt(beepers2)) {
      karel = { x: k.x, y: k.y, facing, beepers: beepers2 };
    }
  }
  const beepers = [];
  if (data.beepers !== void 0) {
    if (!Array.isArray(data.beepers)) {
      errors.push(ErrorMessages.beepersNotAnArray());
    } else {
      data.beepers.forEach((entry, i) => {
        if (!isRecord(entry) || !isInt(entry.x) || !isInt(entry.y) || !isInt(entry.count)) {
          errors.push(ErrorMessages.invalidBeeperEntry(i + 1));
          return;
        }
        if (!inBounds(entry.x, entry.y)) {
          errors.push(ErrorMessages.beeperOutOfBounds(i + 1, entry.x, entry.y));
          return;
        }
        if (entry.count < 1) {
          errors.push(ErrorMessages.invalidBeeperCount(i + 1));
          return;
        }
        beepers.push({ x: entry.x, y: entry.y, count: entry.count });
      });
    }
  }
  const walls = [];
  if (data.walls !== void 0) {
    if (!Array.isArray(data.walls)) {
      errors.push(ErrorMessages.wallsNotAnArray());
    } else {
      data.walls.forEach((entry, i) => {
        if (!isRecord(entry) || !isRecord(entry.from) || !isRecord(entry.to) || !isInt(entry.from.x) || !isInt(entry.from.y) || !isInt(entry.to.x) || !isInt(entry.to.y)) {
          errors.push(ErrorMessages.invalidWallEntry(i + 1));
          return;
        }
        const from = { x: entry.from.x, y: entry.from.y };
        const to = { x: entry.to.x, y: entry.to.y };
        if (!inBounds(from.x, from.y) || !inBounds(to.x, to.y)) {
          errors.push(ErrorMessages.wallOutOfBounds(i + 1));
          return;
        }
        if (!areAdjacent(from, to)) {
          errors.push(ErrorMessages.wallNotAdjacent(i + 1, from.x, from.y, to.x, to.y));
          return;
        }
        walls.push({ from, to });
      });
    }
  }
  if (errors.length > 0 || karel === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    errors: [],
    map: { dimensions: { width, height }, karel, beepers, walls }
  };
}
function wallKey(from, to) {
  if (from.x < to.x || from.x === to.x && from.y < to.y) {
    return `${from.x},${from.y}|${to.x},${to.y}`;
  }
  return `${to.x},${to.y}|${from.x},${from.y}`;
}
function positionKey(pos) {
  return `${pos.x},${pos.y}`;
}
function areAdjacent(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx === 1 && dy === 0 || dx === 0 && dy === 1;
}
var World = class {
  _dimensions;
  _karel;
  _beepers;
  // positionKey -> count
  _walls;
  // wallKey set
  constructor(map) {
    this._dimensions = { ...map.dimensions };
    this._karel = Karel.fromJSON(map.karel);
    this._beepers = /* @__PURE__ */ new Map();
    for (const beeper of map.beepers) {
      const key = positionKey({ x: beeper.x, y: beeper.y });
      this._beepers.set(key, (this._beepers.get(key) ?? 0) + beeper.count);
    }
    this._walls = /* @__PURE__ */ new Set();
    for (const wall of map.walls) {
      this.addWall(wall.from, wall.to);
    }
  }
  get dimensions() {
    return { ...this._dimensions };
  }
  get width() {
    return this._dimensions.width;
  }
  get height() {
    return this._dimensions.height;
  }
  get karel() {
    return this._karel;
  }
  /**
   * Add a wall between two adjacent cells.
   */
  addWall(from, to) {
    if (!areAdjacent(from, to)) {
      throw new Error(ErrorMessages.invalidWall(from.x, from.y, to.x, to.y));
    }
    this._walls.add(wallKey(from, to));
  }
  /**
   * Check if there's a wall between two adjacent cells.
   */
  hasWall(from, to) {
    return this._walls.has(wallKey(from, to));
  }
  /**
   * Check if a position is within world bounds.
   */
  isInBounds(pos) {
    return pos.x >= 1 && pos.x <= this._dimensions.width && pos.y >= 1 && pos.y <= this._dimensions.height;
  }
  /**
   * Check if movement from one position to another is blocked.
   * Blocked if: out of bounds OR wall exists between cells.
   */
  isBlocked(from, to) {
    if (!this.isInBounds(to)) {
      return true;
    }
    return this.hasWall(from, to);
  }
  frontIsBlocked() {
    return this.isBlocked(this._karel.position, this._karel.frontPosition());
  }
  frontIsClear() {
    return !this.frontIsBlocked();
  }
  leftIsBlocked() {
    return this.isBlocked(this._karel.position, this._karel.leftPosition());
  }
  leftIsClear() {
    return !this.leftIsBlocked();
  }
  rightIsBlocked() {
    return this.isBlocked(this._karel.position, this._karel.rightPosition());
  }
  rightIsClear() {
    return !this.rightIsBlocked();
  }
  /**
   * Get beeper count at a position.
   */
  getBeepers(pos) {
    return this._beepers.get(positionKey(pos)) ?? 0;
  }
  nextToABeeper() {
    return this.getBeepers(this._karel.position) > 0;
  }
  beeperInBag() {
    return this._karel.hasBeepersInBag();
  }
  /**
   * Add beepers at a position.
   */
  addBeepers(pos, count = 1) {
    const key = positionKey(pos);
    const current = this._beepers.get(key) ?? 0;
    this._beepers.set(key, current + count);
  }
  /**
   * Remove a beeper from a position.
   * Returns false if no beepers at position.
   */
  removeBeeper(pos) {
    const key = positionKey(pos);
    const current = this._beepers.get(key) ?? 0;
    if (current <= 0) {
      return false;
    }
    if (current === 1) {
      this._beepers.delete(key);
    } else {
      this._beepers.set(key, current - 1);
    }
    return true;
  }
  // ========== Karel Actions ==========
  /**
   * Move Karel forward. Throws if front is blocked (error shutoff).
   */
  move() {
    if (this.frontIsBlocked()) {
      throw new RuntimeError(ErrorMessages.moveBlocked(), void 0, "blocked");
    }
    this._karel.move();
  }
  /**
   * Turn Karel left (counter-clockwise).
   */
  turnLeft() {
    this._karel.turnLeft();
  }
  /**
   * Pick up a beeper at Karel's position. Throws if there is none (error shutoff).
   */
  pickBeeper() {
    const pos = this._karel.position;
    if (!this.removeBeeper(pos)) {
      throw new RuntimeError(ErrorMessages.noBeepersToPickUp(pos.x, pos.y), void 0, "no-beeper");
    }
    this._karel.pickBeeper();
  }
  /**
   * Put down a beeper at Karel's position. Throws if the bag is empty (error shutoff).
   */
  putBeeper() {
    if (!this._karel.putBeeper()) {
      throw new RuntimeError(ErrorMessages.noBeepersInBag(), void 0, "empty-bag");
    }
    this.addBeepers(this._karel.position);
  }
  // ========== Condition Checking ==========
  /**
   * Evaluate a condition by name.
   */
  evaluateCondition(condition) {
    switch (condition.toLowerCase()) {
      case "front-is-clear":
        return this.frontIsClear();
      case "front-is-blocked":
        return this.frontIsBlocked();
      case "left-is-clear":
        return this.leftIsClear();
      case "left-is-blocked":
        return this.leftIsBlocked();
      case "right-is-clear":
        return this.rightIsClear();
      case "right-is-blocked":
        return this.rightIsBlocked();
      case "next-to-a-beeper":
        return this.nextToABeeper();
      case "not-next-to-a-beeper":
        return !this.nextToABeeper();
      case "facing-north":
        return this._karel.isFacing("north" /* North */);
      case "not-facing-north":
        return !this._karel.isFacing("north" /* North */);
      case "facing-south":
        return this._karel.isFacing("south" /* South */);
      case "not-facing-south":
        return !this._karel.isFacing("south" /* South */);
      case "facing-east":
        return this._karel.isFacing("east" /* East */);
      case "not-facing-east":
        return !this._karel.isFacing("east" /* East */);
      case "facing-west":
        return this._karel.isFacing("west" /* West */);
      case "not-facing-west":
        return !this._karel.isFacing("west" /* West */);
      case "beeper-in-bag":
        return this.beeperInBag();
      case "no-beeper-in-bag":
        return !this.beeperInBag();
      default:
        throw new RuntimeError(
          ErrorMessages.unknownCondition(condition),
          void 0,
          "unknown-name"
        );
    }
  }
  // ========== Serialization ==========
  /**
   * Get all beeper positions and counts.
   */
  getAllBeepers() {
    const result = [];
    for (const [key, count] of this._beepers) {
      const [x, y] = key.split(",").map(Number);
      result.push({ x, y, count });
    }
    return result;
  }
  /**
   * Get all walls.
   */
  getAllWalls() {
    const result = [];
    for (const key of this._walls) {
      const [fromStr, toStr] = key.split("|");
      const [fromX, fromY] = fromStr.split(",").map(Number);
      const [toX, toY] = toStr.split(",").map(Number);
      result.push({
        from: { x: fromX, y: fromY },
        to: { x: toX, y: toY }
      });
    }
    return result;
  }
  /**
   * Serialize world state to KarelMap format.
   */
  toJSON() {
    return {
      dimensions: { ...this._dimensions },
      karel: this._karel.toJSON(),
      beepers: this.getAllBeepers(),
      walls: this.getAllWalls()
    };
  }
};

// src/types/tokens.ts
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2["BeginningOfProgram"] = "BEGINNING-OF-PROGRAM";
  TokenType2["EndOfProgram"] = "END-OF-PROGRAM";
  TokenType2["BeginningOfExecution"] = "BEGINNING-OF-EXECUTION";
  TokenType2["EndOfExecution"] = "END-OF-EXECUTION";
  TokenType2["Begin"] = "BEGIN";
  TokenType2["End"] = "END";
  TokenType2["If"] = "IF";
  TokenType2["Then"] = "THEN";
  TokenType2["Else"] = "ELSE";
  TokenType2["While"] = "WHILE";
  TokenType2["Do"] = "DO";
  TokenType2["Iterate"] = "ITERATE";
  TokenType2["Times"] = "TIMES";
  TokenType2["DefineNewInstruction"] = "DEFINE-NEW-INSTRUCTION";
  TokenType2["As"] = "AS";
  TokenType2["Condition"] = "CONDITION";
  TokenType2["Number"] = "NUMBER";
  TokenType2["Identifier"] = "IDENTIFIER";
  TokenType2["Semicolon"] = "SEMICOLON";
  TokenType2["EOF"] = "EOF";
  return TokenType2;
})(TokenType || {});

// src/parsing/constants.ts
var VALID_CONDITIONS = /* @__PURE__ */ new Set([
  "front-is-clear",
  "front-is-blocked",
  "left-is-clear",
  "left-is-blocked",
  "right-is-clear",
  "right-is-blocked",
  "next-to-a-beeper",
  "not-next-to-a-beeper",
  "facing-north",
  "not-facing-north",
  "facing-south",
  "not-facing-south",
  "facing-east",
  "not-facing-east",
  "facing-west",
  "not-facing-west",
  "beeper-in-bag",
  "no-beeper-in-bag"
]);
var BUILT_IN_INSTRUCTIONS = /* @__PURE__ */ new Set([
  "move",
  "turnleft",
  "pickbeeper",
  "putbeeper",
  "turnoff"
]);

// src/parsing/lexer.ts
var Lexer = class {
  constructor(source) {
    this.source = source;
  }
  source;
  tokens = [];
  tokenize() {
    this.tokens = [];
    const lines = this.source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      this.tokenizeLine(lines[i], i + 1);
    }
    this.tokens.push({
      type: "EOF" /* EOF */,
      value: "",
      line: Math.max(1, lines.length),
      column: 0
    });
    return this.tokens;
  }
  tokenizeLine(text, line) {
    const commentStart = text.indexOf("//");
    const code = commentStart >= 0 ? text.slice(0, commentStart) : text;
    let i = 0;
    while (i < code.length) {
      const ch = code[i];
      if (isSpace(ch)) {
        i++;
        continue;
      }
      if (ch === ";") {
        this.tokens.push({ type: "SEMICOLON" /* Semicolon */, value: ";", line, column: i });
        i++;
        continue;
      }
      const start = i;
      while (i < code.length && !isSpace(code[i]) && code[i] !== ";") {
        i++;
      }
      this.addWord(code.slice(start, i), line, start);
    }
  }
  addWord(word, line, column) {
    const upperWord = word.toUpperCase();
    let type;
    switch (upperWord) {
      case "BEGINNING-OF-PROGRAM":
        type = "BEGINNING-OF-PROGRAM" /* BeginningOfProgram */;
        break;
      case "END-OF-PROGRAM":
        type = "END-OF-PROGRAM" /* EndOfProgram */;
        break;
      case "BEGINNING-OF-EXECUTION":
        type = "BEGINNING-OF-EXECUTION" /* BeginningOfExecution */;
        break;
      case "END-OF-EXECUTION":
        type = "END-OF-EXECUTION" /* EndOfExecution */;
        break;
      case "BEGIN":
        type = "BEGIN" /* Begin */;
        break;
      case "END":
        type = "END" /* End */;
        break;
      case "IF":
        type = "IF" /* If */;
        break;
      case "THEN":
        type = "THEN" /* Then */;
        break;
      case "ELSE":
        type = "ELSE" /* Else */;
        break;
      case "WHILE":
        type = "WHILE" /* While */;
        break;
      case "DO":
        type = "DO" /* Do */;
        break;
      case "ITERATE":
        type = "ITERATE" /* Iterate */;
        break;
      case "TIMES":
        type = "TIMES" /* Times */;
        break;
      case "DEFINE-NEW-INSTRUCTION":
        type = "DEFINE-NEW-INSTRUCTION" /* DefineNewInstruction */;
        break;
      case "AS":
        type = "AS" /* As */;
        break;
      default:
        if (/^\d+$/.test(word)) {
          type = "NUMBER" /* Number */;
        } else if (VALID_CONDITIONS.has(word.toLowerCase())) {
          type = "CONDITION" /* Condition */;
        } else {
          type = "IDENTIFIER" /* Identifier */;
        }
    }
    this.tokens.push({ type, value: word, line, column });
  }
};
function isSpace(ch) {
  return /\s/.test(ch);
}

// src/parsing/parser.ts
var STATEMENT_BOUNDARIES = /* @__PURE__ */ new Set([
  "IF" /* If */,
  "WHILE" /* While */,
  "ITERATE" /* Iterate */,
  "BEGIN" /* Begin */,
  "END" /* End */,
  "ELSE" /* Else */,
  "DEFINE-NEW-INSTRUCTION" /* DefineNewInstruction */,
  "BEGINNING-OF-EXECUTION" /* BeginningOfExecution */,
  "END-OF-EXECUTION" /* EndOfExecution */,
  "END-OF-PROGRAM" /* EndOfProgram */
]);
var Parser = class {
  tokens = [];
  current = 0;
  diagnostics = [];
  customInstructions = /* @__PURE__ */ new Set();
  parse(source) {
    this.tokens = new Lexer(source).tokenize();
    this.current = 0;
    this.diagnostics = [];
    this.customInstructions = /* @__PURE__ */ new Set();
    if (this.check("EOF" /* EOF */)) {
      this.report(ErrorMessages.emptyProgram(), this.peek());
      return { ast: null, diagnostics: this.diagnostics };
    }
    this.collectInstructionNames();
    const ast = this.parseProgram();
    return { ast, diagnostics: this.diagnostics };
  }
  /**
   * Pre-pass: register every DEFINE-NEW-INSTRUCTION name up front so calls
   * may reference instructions defined later in the file (forward references)
   * and instructions may call themselves (recursion).
   */
  collectInstructionNames() {
    for (let i = 0; i < this.tokens.length - 1; i++) {
      if (this.tokens[i].type !== "DEFINE-NEW-INSTRUCTION" /* DefineNewInstruction */) {
        continue;
      }
      const nameToken = this.tokens[i + 1];
      if (nameToken.type !== "IDENTIFIER" /* Identifier */) {
        continue;
      }
      const name = nameToken.value.toLowerCase();
      if (BUILT_IN_INSTRUCTIONS.has(name)) {
        this.report(ErrorMessages.cannotRedefineBuiltIn(nameToken.value), nameToken);
      } else if (this.customInstructions.has(name)) {
        this.report(ErrorMessages.duplicateInstruction(nameToken.value), nameToken, "warning");
      }
      this.customInstructions.add(name);
    }
  }
  parseProgram() {
    this.expectStructure("BEGINNING-OF-PROGRAM" /* BeginningOfProgram */, ErrorMessages.missingProgramStart());
    const definitions = [];
    while (this.check("DEFINE-NEW-INSTRUCTION" /* DefineNewInstruction */)) {
      const def = this.parseDefineInstruction();
      if (def) {
        definitions.push(def);
      }
    }
    this.expectStructure("BEGINNING-OF-EXECUTION" /* BeginningOfExecution */, ErrorMessages.missingExecutionStart());
    const statements = this.parseStatementsUntil([
      "END-OF-EXECUTION" /* EndOfExecution */,
      "END-OF-PROGRAM" /* EndOfProgram */
    ]);
    if (statements.length > 0 && !this.containsTurnoff(statements, definitions)) {
      this.report(ErrorMessages.missingTurnoff(), this.peek(), "warning");
    }
    this.expectStructure("END-OF-EXECUTION" /* EndOfExecution */, ErrorMessages.missingExecutionEnd());
    this.expectStructure("END-OF-PROGRAM" /* EndOfProgram */, ErrorMessages.missingProgramEnd());
    if (!this.check("EOF" /* EOF */)) {
      this.report(ErrorMessages.contentAfterProgramEnd(), this.peek(), "warning");
    }
    return {
      type: "program",
      definitions,
      execution: { type: "execution", statements }
    };
  }
  parseDefineInstruction() {
    const defToken = this.advance();
    if (!this.check("IDENTIFIER" /* Identifier */)) {
      this.report(ErrorMessages.expectedInstructionName(), this.peek());
      this.synchronize();
      return null;
    }
    const nameToken = this.advance();
    if (this.check("AS" /* As */)) {
      this.advance();
    } else {
      this.report(ErrorMessages.expectedKeyword("AS", this.peek().value), this.peek());
    }
    const body = this.parseBody();
    return {
      type: "define",
      name: nameToken.value,
      body,
      line: defToken.line
    };
  }
  /**
   * A statement list bounded by the given closing tokens (or EOF).
   */
  parseStatementsUntil(stopTypes) {
    const statements = [];
    while (!this.checkAny(stopTypes) && !this.check("EOF" /* EOF */)) {
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      }
    }
    return statements;
  }
  /**
   * The body of THEN/ELSE/DO/TIMES/AS: either a BEGIN...END block or,
   * as in classic Karel, a single statement.
   */
  parseBody() {
    if (this.check("BEGIN" /* Begin */)) {
      return this.parseBlock();
    }
    if (this.check("EOF" /* EOF */)) {
      this.report(ErrorMessages.expectedKeyword("BEGIN or an instruction", ""), this.peek());
      return { type: "block", statements: [] };
    }
    const statement = this.parseStatement();
    return { type: "block", statements: statement ? [statement] : [] };
  }
  parseBlock() {
    this.advance();
    const statements = this.parseStatementsUntil([
      "END" /* End */,
      "END-OF-EXECUTION" /* EndOfExecution */,
      "END-OF-PROGRAM" /* EndOfProgram */
    ]);
    if (this.check("END" /* End */)) {
      this.advance();
      this.skipOptionalSemicolon();
    } else {
      this.report(ErrorMessages.expectedKeyword("END", this.peek().value), this.peek());
    }
    return { type: "block", statements };
  }
  parseStatement() {
    const token = this.peek();
    switch (token.type) {
      case "IF" /* If */:
        return this.parseIf();
      case "WHILE" /* While */:
        return this.parseWhile();
      case "ITERATE" /* Iterate */:
        return this.parseIterate();
      case "BEGIN" /* Begin */:
        return this.parseBlock();
      case "IDENTIFIER" /* Identifier */:
        return this.parseInstructionCall();
      case "SEMICOLON" /* Semicolon */:
        this.advance();
        this.report(ErrorMessages.unexpectedSemicolon(), token);
        return null;
      default:
        this.advance();
        this.report(ErrorMessages.unexpectedToken(token.value), token);
        return null;
    }
  }
  parseCondition() {
    if (this.check("CONDITION" /* Condition */)) {
      return this.advance().value;
    }
    const token = this.peek();
    this.report(ErrorMessages.unknownCondition(token.value || "nothing"), token);
    if (token.type === "IDENTIFIER" /* Identifier */) {
      this.advance();
      return token.value;
    }
    return "";
  }
  parseIf() {
    const ifToken = this.advance();
    const condition = this.parseCondition();
    if (this.check("THEN" /* Then */)) {
      this.advance();
    } else {
      this.report(ErrorMessages.expectedKeyword("THEN", this.peek().value), this.peek());
    }
    const thenBranch = this.parseBody();
    let elseBranch;
    if (this.check("ELSE" /* Else */)) {
      this.advance();
      elseBranch = this.parseBody();
    }
    return { type: "if", condition, thenBranch, elseBranch, line: ifToken.line };
  }
  parseWhile() {
    const whileToken = this.advance();
    const condition = this.parseCondition();
    if (this.check("DO" /* Do */)) {
      this.advance();
    } else {
      this.report(ErrorMessages.expectedKeyword("DO", this.peek().value), this.peek());
    }
    const body = this.parseBody();
    return { type: "while", condition, body, line: whileToken.line };
  }
  parseIterate() {
    const iterateToken = this.advance();
    let count = 0;
    if (this.check("NUMBER" /* Number */)) {
      count = parseInt(this.advance().value, 10);
    } else {
      this.report(ErrorMessages.invalidIterateCount(), this.peek());
      if (this.check("IDENTIFIER" /* Identifier */)) {
        this.advance();
      }
    }
    if (this.check("TIMES" /* Times */)) {
      this.advance();
    } else {
      this.report(ErrorMessages.expectedKeyword("TIMES", this.peek().value), this.peek());
    }
    const body = this.parseBody();
    return { type: "iterate", count, body, line: iterateToken.line };
  }
  parseInstructionCall() {
    const token = this.advance();
    const lowerName = token.value.toLowerCase();
    if (!BUILT_IN_INSTRUCTIONS.has(lowerName) && !this.customInstructions.has(lowerName)) {
      this.report(ErrorMessages.unknownInstruction(token.value), token);
    }
    if (this.check("SEMICOLON" /* Semicolon */)) {
      this.advance();
    } else if (!this.checkAny([
      "END" /* End */,
      "ELSE" /* Else */,
      "END-OF-EXECUTION" /* EndOfExecution */,
      "END-OF-PROGRAM" /* EndOfProgram */,
      "EOF" /* EOF */
    ])) {
      this.report(ErrorMessages.missingSemicolon(), token);
    }
    return { type: "call", name: token.value, line: token.line };
  }
  /**
   * Expect a structural keyword; report (without consuming anything) if absent.
   */
  expectStructure(type, message) {
    if (this.check(type)) {
      this.advance();
      this.skipOptionalSemicolon();
      return;
    }
    this.report(message, this.peek());
  }
  skipOptionalSemicolon() {
    if (this.check("SEMICOLON" /* Semicolon */)) {
      this.advance();
    }
  }
  /**
   * Skip tokens until a likely statement boundary, guaranteeing progress.
   */
  synchronize() {
    if (!this.isAtEnd()) {
      this.advance();
    }
    while (!this.isAtEnd()) {
      if (this.tokens[this.current - 1].type === "SEMICOLON" /* Semicolon */) {
        return;
      }
      if (STATEMENT_BOUNDARIES.has(this.peek().type)) {
        return;
      }
      this.advance();
    }
  }
  containsTurnoff(statements, definitions) {
    const visit = (nodes) => {
      for (const node of nodes) {
        switch (node.type) {
          case "call":
            if (node.name.toLowerCase() === "turnoff") {
              return true;
            }
            break;
          case "block":
            if (visit(node.statements)) {
              return true;
            }
            break;
          case "if": {
            const ifNode = node;
            if (visit(ifNode.thenBranch.statements)) {
              return true;
            }
            if (ifNode.elseBranch && visit(ifNode.elseBranch.statements)) {
              return true;
            }
            break;
          }
          case "while":
            if (visit(node.body.statements)) {
              return true;
            }
            break;
          case "iterate":
            if (visit(node.body.statements)) {
              return true;
            }
            break;
        }
      }
      return false;
    };
    return visit(statements) || definitions.some((d) => visit(d.body.statements));
  }
  report(message, token, severity = "error") {
    this.diagnostics.push({
      message,
      line: token.line,
      column: token.column,
      endColumn: token.column + Math.max(token.value.length, 1),
      severity
    });
  }
  // Helper methods
  peek() {
    return this.tokens[this.current];
  }
  check(type) {
    return this.peek().type === type;
  }
  checkAny(types) {
    const current = this.peek().type;
    return types.some((t) => t === current);
  }
  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.tokens[this.current - 1];
  }
  isAtEnd() {
    return this.peek().type === "EOF" /* EOF */;
  }
};

// src/execution/interpreter.ts
var DEFAULT_MAX_STEPS = 1e5;
var MAX_STACK_DEPTH = 2e3;
var MAX_INTERNAL_SPINS = 1e6;
var MIN_SPEED_MS = 10;
var MAX_SPEED_MS = 5e3;
var Interpreter = class {
  world;
  ast = null;
  customInstructions = /* @__PURE__ */ new Map();
  stack = [];
  started = false;
  finished = false;
  stopRequested = false;
  runLoopActive = false;
  visibleSteps = 0;
  executionSpeed = 500;
  maxSteps;
  // Callbacks for UI updates
  onStep;
  onComplete;
  onError;
  /**
   * @param options.maxSteps Visible instructions allowed before the run is
   *   declared an infinite loop. Lower it for batch grading, raise it for a
   *   program that legitimately does a lot of work. A value that is not a
   *   positive finite number falls back to the default rather than disabling
   *   the guard, which is what NaN, 0 or Infinity would silently do.
   */
  constructor(world, options) {
    this.world = world;
    const requested = options?.maxSteps;
    this.maxSteps = typeof requested === "number" && Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : DEFAULT_MAX_STEPS;
  }
  get isStarted() {
    return this.started;
  }
  get isFinished() {
    return this.finished;
  }
  /**
   * Load and parse a program. Returns the parser diagnostics; callers should
   * refuse to execute when any diagnostic has severity "error".
   */
  load(source) {
    const parser = new Parser();
    const { ast, diagnostics } = parser.parse(source);
    this.ast = ast;
    this.customInstructions.clear();
    if (ast) {
      for (const def of ast.definitions) {
        this.customInstructions.set(def.name.toLowerCase(), def.body);
      }
    }
    return diagnostics;
  }
  /**
   * Run the program with an animation delay between visible steps.
   * Resolves when the program completes, errors, or is stopped.
   */
  async run() {
    if (this.runLoopActive) {
      return;
    }
    this.ensureInitialized();
    this.stopRequested = false;
    this.runLoopActive = true;
    try {
      while (!this.finished && !this.stopRequested) {
        const hasMore = this.advanceOneStep();
        if (!hasMore) {
          break;
        }
        await this.delay();
      }
    } finally {
      this.runLoopActive = false;
    }
  }
  /**
   * Execute a single visible step. Returns true if there is more to execute.
   */
  step() {
    if (this.finished) {
      return false;
    }
    this.ensureInitialized();
    this.stopRequested = false;
    return this.advanceOneStep();
  }
  /**
   * Request that a running loop stops after the current step.
   */
  stop() {
    this.stopRequested = true;
  }
  /**
   * Set execution speed in milliseconds between steps. Applies live.
   */
  setSpeed(ms) {
    this.executionSpeed = Math.max(MIN_SPEED_MS, Math.min(MAX_SPEED_MS, ms));
  }
  ensureInitialized() {
    if (!this.ast) {
      throw new RuntimeError(ErrorMessages.programNotLoaded(), void 0, "internal");
    }
    if (!this.started) {
      this.stack = [{ type: "block", statements: this.ast.execution.statements, index: 0 }];
      this.started = true;
      this.finished = false;
      this.visibleSteps = 0;
    }
  }
  /**
   * Execute one step, translating the outcome into callbacks.
   */
  advanceOneStep() {
    try {
      const hasMore = this.executeOneStep();
      if (!hasMore) {
        this.finished = true;
        this.onComplete?.();
      }
      return hasMore;
    } catch (e) {
      this.finished = true;
      if (e instanceof RuntimeError) {
        this.onError?.(e);
        return false;
      }
      throw e;
    }
  }
  /**
   * Advance until exactly one instruction call has executed.
   * Returns true if there is more program to run afterwards.
   */
  executeOneStep() {
    let spins = 0;
    while (this.stack.length > 0) {
      if (++spins > MAX_INTERNAL_SPINS) {
        throw new RuntimeError(ErrorMessages.stuckWithoutProgress(), void 0, "limit");
      }
      const frame = this.stack[this.stack.length - 1];
      if (frame.type === "block") {
        if (frame.index >= frame.statements.length) {
          this.stack.pop();
          continue;
        }
        const statement = frame.statements[frame.index++];
        switch (statement.type) {
          case "call": {
            const call = statement;
            const result = this.executeCall(call);
            if (result === "expanded") {
              continue;
            }
            this.visibleSteps++;
            if (this.visibleSteps > this.maxSteps) {
              throw new RuntimeError(
                ErrorMessages.maxIterationsReached(this.maxSteps),
                call.line,
                "limit"
              );
            }
            this.onStep?.(call.line);
            return result !== "off";
          }
          case "if": {
            if (this.evaluateCondition(statement.condition, statement.line)) {
              this.stack.push({
                type: "block",
                statements: statement.thenBranch.statements,
                index: 0
              });
            } else if (statement.elseBranch) {
              this.stack.push({
                type: "block",
                statements: statement.elseBranch.statements,
                index: 0
              });
            }
            continue;
          }
          case "while": {
            this.stack.push({
              type: "while",
              condition: statement.condition,
              body: statement.body,
              line: statement.line
            });
            continue;
          }
          case "iterate": {
            if (statement.count > 0) {
              this.stack.push({
                type: "iterate",
                remaining: statement.count,
                body: statement.body
              });
            }
            continue;
          }
          case "block": {
            this.stack.push({
              type: "block",
              statements: statement.statements,
              index: 0
            });
            continue;
          }
          default:
            continue;
        }
      } else if (frame.type === "while") {
        if (!this.evaluateCondition(frame.condition, frame.line)) {
          this.stack.pop();
          continue;
        }
        this.stack.push({ type: "block", statements: frame.body.statements, index: 0 });
        continue;
      } else {
        if (frame.remaining <= 0) {
          this.stack.pop();
          continue;
        }
        frame.remaining--;
        this.stack.push({ type: "block", statements: frame.body.statements, index: 0 });
        continue;
      }
    }
    return false;
  }
  /**
   * Evaluate a condition, stamping the source line onto any RuntimeError the
   * world raises. The world has no notion of line numbers, so without this an
   * unknown condition inside IF/WHILE would surface with line === undefined —
   * unlike every failure reached through executeCall.
   */
  evaluateCondition(condition, line) {
    try {
      return this.world.evaluateCondition(condition);
    } catch (e) {
      if (e instanceof RuntimeError) {
        if (e.line === void 0) {
          e.line = line;
        }
        throw e;
      }
      if (e instanceof Error) {
        throw new RuntimeError(e.message, line);
      }
      throw e;
    }
  }
  /**
   * Execute a single instruction call against the world.
   * Errors are wrapped in RuntimeError carrying the source line.
   */
  executeCall(node) {
    const name = node.name.toLowerCase();
    try {
      switch (name) {
        case "move":
          this.world.move();
          return "action";
        case "turnleft":
          this.world.turnLeft();
          return "action";
        case "pickbeeper":
          this.world.pickBeeper();
          return "action";
        case "putbeeper":
          this.world.putBeeper();
          return "action";
        case "turnoff":
          return "off";
        default: {
          const body = this.customInstructions.get(name);
          if (!body) {
            throw new RuntimeError(
              ErrorMessages.unknownInstruction(node.name),
              node.line,
              "unknown-name"
            );
          }
          if (this.stack.length >= MAX_STACK_DEPTH) {
            throw new RuntimeError(ErrorMessages.recursionTooDeep(node.name), node.line, "limit");
          }
          this.stack.push({ type: "block", statements: body.statements, index: 0 });
          return "expanded";
        }
      }
    } catch (e) {
      if (e instanceof RuntimeError) {
        if (e.line === void 0) {
          e.line = node.line;
        }
        throw e;
      }
      if (e instanceof Error) {
        throw new RuntimeError(e.message, node.line);
      }
      throw e;
    }
  }
  delay() {
    return new Promise((resolve) => setTimeout(resolve, this.executionSpeed));
  }
};

// src/goal.ts
function sameExercise(world, expected) {
  const w = world.dimensions;
  const e = expected.dimensions;
  if (w.width !== e.width || w.height !== e.height) {
    return ErrorMessages.goalDifferentSize(w.width, w.height, e.width, e.height);
  }
  const inWorld = wallKeys(world);
  const inExpected = wallKeys(expected);
  if (inWorld.size !== inExpected.size) {
    return ErrorMessages.goalDifferentWallCount(inWorld.size, inExpected.size);
  }
  for (const key of inWorld) {
    if (!inExpected.has(key)) {
      return ErrorMessages.goalWallNotInExpected(key);
    }
  }
  return null;
}
function wallKeys(map) {
  return new Set(
    map.walls.map(({ from, to }) => {
      const ends = [`(${from.x}, ${from.y})`, `(${to.x}, ${to.y})`].sort();
      return `${ends[0]}\u2013${ends[1]}`;
    })
  );
}
function compareWorlds(expected, actual, options = {}) {
  const e = expected.karel;
  const a = actual.karel;
  if (e.x !== a.x || e.y !== a.y) {
    return ErrorMessages.goalWrongCorner(e.x, e.y, a.x, a.y);
  }
  if (!options.ignoreFacing && e.facing !== a.facing) {
    return ErrorMessages.goalWrongFacing(e.facing, a.facing);
  }
  if (e.beepers !== a.beepers) {
    return ErrorMessages.goalWrongBag(e.beepers, a.beepers);
  }
  const expectedPiles = pileMap(expected);
  const actualPiles = pileMap(actual);
  for (const [corner, count] of expectedPiles) {
    const found = actualPiles.get(corner) ?? 0;
    if (found !== count) {
      return ErrorMessages.goalWrongPile(count, corner, found);
    }
  }
  for (const [corner, count] of actualPiles) {
    if (!expectedPiles.has(corner)) {
      return ErrorMessages.goalUnexpectedPile(corner, count);
    }
  }
  return null;
}
function pileMap(map) {
  return new Map(map.beepers.filter((b) => b.count > 0).map((b) => [`(${b.x}, ${b.y})`, b.count]));
}
export {
  BUILT_IN_INSTRUCTIONS,
  Direction,
  Interpreter,
  Karel,
  Lexer,
  MAX_WORLD_SIZE,
  Parser,
  RuntimeError,
  TokenType,
  VALID_CONDITIONS,
  World,
  compareWorlds,
  getLocale,
  parseDirection,
  sameExercise,
  setLocale,
  validateKarelMap
};
