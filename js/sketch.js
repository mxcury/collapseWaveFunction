let tiles = [];
const tileImages = [];

let grid = [];

const DIM = 16;

const dirSize = 2;

function preload() {
    const path = "res/mountains";

    for (let i = 0; i < dirSize; i++) {
        tileImages[i] = loadImage(`${path}/${i}.png`);
    }
}

function removeDuplicatedTiles(tiles) {
    const uniqueTilesMap = {};
    for (const tile of tiles) {
        const key = tile.edges.join(",");
        uniqueTilesMap[key] = tile;
    }
    return Object.values(uniqueTilesMap);
}

function setup() {
    createCanvas(1080, 1080);

    //TODO: generate sockets
    //? circuit_board : dirSize = 13;
    /* tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]);
    tiles[1] = new Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"]);
    tiles[2] = new Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"]);
    tiles[3] = new Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"]);
    tiles[4] = new Tile(tileImages[4], ["ABB", "BCB", "BBA", "AAA"]);
    tiles[5] = new Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"]);
    tiles[6] = new Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"]);
    tiles[7] = new Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"]);
    tiles[8] = new Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"]);
    tiles[9] = new Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"]);
    tiles[10] = new Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"]);
    tiles[11] = new Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"]);
    tiles[12] = new Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"]); */

    //? demo/pipes/mountains/pipes/polka/roads/train-tracks: dirSize = 2;
    tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]);
    tiles[1] = new Tile(tileImages[1], ["ABA", "ABA", "AAA", "ABA"]);

    //? rail : dirSize = 7;
    /* tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"]);
    tiles[1] = new Tile(tileImages[1], ["ABA", "ABA", "ABA", "AAA"]);
    tiles[2] = new Tile(tileImages[2], ["BAA", "AAB", "AAA", "AAA"]);
    tiles[3] = new Tile(tileImages[3], ["BAA", "AAA", "AAB", "AAA"]);
    tiles[4] = new Tile(tileImages[4], ["ABA", "ABA", "AAA", "AAA"]);
    tiles[5] = new Tile(tileImages[5], ["ABA", "AAA", "ABA", "AAA"]);
    tiles[6] = new Tile(tileImages[6], ["ABA", "ABA", "ABA", "ABA"]); */

    for (let i = 0; i < dirSize - 1; i++) {
        tiles[i].index = i;
    }

    const initialTileCount = tiles.length;

    //? set i = 1 when using cwf on mountains imgs
    for (let i = 1; i < initialTileCount; i++) {
        let tempTiles = [];

        for (let j = 0; j < 4; j++) {
            tempTiles.push(tiles[i].rotate(j));
        }

        tempTiles = removeDuplicatedTiles(tempTiles);
        tiles = tiles.concat(tempTiles);
    }

    // Generate the adjacency rules based on edges
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        tile.analyze(tiles);
    }

    startOver();
}

function startOver() {
    // Create cell for each spot on the grid
    for (let i = 0; i < DIM * DIM; i++) {
        grid[i] = new Cell(tiles.length);
    }
}

function checkValid(arr, valid) {
    for (let i = arr.length - 1; i >= 0; i--) {
        let element = arr[i];
        if (!valid.includes(element)) {
            arr.splice(i, 1);
        }
    }
}

function mousePressed() {
    redraw();
}

function draw() {
    background(0);

    const w = width / DIM;
    const h = height / DIM;

    for (let j = 0; j < DIM; j++) {
        for (let i = 0; i < DIM; i++) {
            let cell = grid[i + j * DIM];
            if (cell.collapsed) {
                let index = cell.options[0];
                image(tiles[index].img, i * w, j * h, w, h);
            } else {
                noFill();
                stroke(51);
                rect(i * w, j * h, w, h);
            }
        }
    }

    // Pick cell with least entropy
    let gridCopy = grid.slice();

    gridCopy = gridCopy.filter((a) => !a.collapsed);

    if (gridCopy.length == 0) {
        return;
    }
    gridCopy.sort((a, b) => {
        return a.options.length - b.options.length;
    });

    let len = gridCopy[0].options.length;
    let stopIndex = 0;
    for (let i = 1; i < gridCopy.length; i++) {
        if (gridCopy[i].options.length > len) {
            stopIndex = i;
            break;
        }
    }

    if (stopIndex > 0) gridCopy.splice(stopIndex);

    const cell = random(gridCopy);
    cell.collapsed = true;
    const pick = random(cell.options);
    if (pick === undefined) {
        startOver();
        return;
    }
    cell.options = [pick];

    const nextGrid = [];

    for (let j = 0; j < DIM; j++) {
        for (let i = 0; i < DIM; i++) {
            let index = i + j * DIM;
            if (grid[index].collapsed) {
                nextGrid[index] = grid[index];
            } else {
                let options = new Array(tiles.length).fill(0).map((x, i) => i);

                // Look up
                if (j > 0) {
                    let up = grid[i + (j - 1) * DIM];
                    let validOptions = [];
                    for (let option of up.options) {
                        let valid = tiles[option].down;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }

                // Look right
                if (i < DIM - 1) {
                    let right = grid[i + 1 + j * DIM];
                    let validOptions = [];
                    for (let option of right.options) {
                        let valid = tiles[option].left;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }

                // Look down
                if (j < DIM - 1) {
                    let down = grid[i + (j + 1) * DIM];
                    let validOptions = [];
                    for (let option of down.options) {
                        let valid = tiles[option].up;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }

                // Look left
                if (i > 0) {
                    let left = grid[i - 1 + j * DIM];
                    let validOptions = [];
                    for (let option of left.options) {
                        let valid = tiles[option].right;
                        validOptions = validOptions.concat(valid);
                    }
                    checkValid(options, validOptions);
                }

                nextGrid[index] = new Cell(options);
            }
        }
    }

    grid = nextGrid;
}
