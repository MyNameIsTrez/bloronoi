// This is version 7 and draws voronoi areas with squares, rather than drawing pixels at a time.
// Note that unlike most linked list quadtrees, this one is of a fixed size made from arrays.

// Version 6: https://editor.p5js.org/MyNameIsTrez/sketches/R4uLVTkVh

const WIDTH = 8;
const HEIGHT = 8;
const DESIRED_FRAMERATE = 1;
const LOOPS_PER_DRAW = 1;
const PIXEL_SCALE = 40;

const HALF_PIXEL_SCALE = PIXEL_SCALE / 2;
// const PIXEL_COUNT = WIDTH * HEIGHT;

// In C: #define C 420420420
const C = "C";
// In C: #define P 133713370
const P = "P";

function setup() {
  createCanvas(WIDTH * PIXEL_SCALE - 1, HEIGHT * PIXEL_SCALE - 1);
  background(42);
  noStroke();
  // frameRate(DESIRED_FRAMERATE);

  // TODO: Comment this out!!!
  // This is here for example.txt so the second placed seed is 63.
  randomSeed(194);

  // let seeds = [9, 63, 25, 5];
  // let seeds = [9, 63, 25, 5];
  // let seeds = [9, 63, 25, 5, 1, 2, 3];
  // let seeds = [0, 1, 2];
  // let seeds = [0, 1];
  // let seeds = [1, 2, 3];
  // let seeds = [1, 2];
  let starting_seed = 9;

  // In C: t_bloronoi t;
  let t = {};

  // N      : 3, 4, 5, 6, 7, 8
  // log2(N): 2, 3, 3, 3, 3, 4
  // Want   : 3, 3, 4, 4, 4, 4
  t.level_count = rt_log2(Math.max(WIDTH, HEIGHT) - 1) + 1;
  // console.log(t.level_count);

  t.grids = init_grids(t.level_count);
  // console.log(t.grids);

  // In C: t.grids[0][0] = rt_random(data->pixel_count);
  // t.grids[0][0] = seeds[0]; // TODO: Use = floor(random(PIXEL_COUNT));
  t.grids[0][0] = starting_seed; // TODO: Use = floor(random(PIXEL_COUNT));

  t.max_side_length = rt_pow2(t.level_count - 1);
  // console.log(t.max_side_length);

  // In C: Get the color based on casting a ray at the pixel with as index the seed value.
  fill(242, 42, 42);
  draw_square(t, 0, 1);

  t.available_cells = init_available_cells(t);
  t.available_cells_inverse = init_available_cells(t);
  // console.log(t.available_cells);
  // console.log(t.available_cells_inverse);

  init_available_cell_lengths(t);
  // console.log(t.available_cell_lengths);

  t.highest_level_having_seed_cell = 0;

  let colors = [
    [242, 42, 42],
    [42, 242, 42],
    [42, 42, 242],
    [242, 242, 42],
    [242, 42, 242],
    [42, 242, 242],
  ];

  let seed_valued_cell_index;

  let start_cell_x;
  let start_cell_y;

  for (let _ = 0; _ < WIDTH * HEIGHT; _++) {
    // This ensures that any other seed will be closer.
    voronoi.push(2147483647);
  }
  fill(colors[0]);
  // voronoiFloodfill(seeds[0]);
  voronoiFloodfill(starting_seed);

  // console.log(`t.available_cells: ${t.available_cell_lengths}`)

  // for (let i = 1; i < seeds.length; i++)
  for (let i = 1; i < 5; i++)
  {
    console.log(`t.highest_level_having_seed_cell: ${t.highest_level_having_seed_cell}`);
    seed_valued_cell_index = get_seed_valued_cell_index(t);
    console.log(`seed_valued_cell_index: ${seed_valued_cell_index}`);

    t.new_seed = t.grids[t.highest_level_having_seed_cell][seed_valued_cell_index];
    // print_array(grids[t.highest_level_having_seed_cell]);
    // console.log(seed);

    t.side_length = rt_pow2(t.highest_level_having_seed_cell);

    t.new_seed = get_new_seed(t, seed_valued_cell_index);
    // let seed = seeds[i];
    // t.new_seed = seed;
    console.log(`.new_seed: ${t.new_seed}`);

    fill(colors[i % colors.length]);
    // console.log(colors[i]);

    // console.log(t.new_seed, t.side_length, t.max_side_length);
    start_cell_x = get_start_cell_x(t.new_seed, t.side_length, t.max_side_length);
    start_cell_y = get_start_cell_y(t.new_seed, t.side_length, t.max_side_length);
    // console.log(start_cell_x, start_cell_y);

    voronoi_floodfill(t, start_cell_x, start_cell_y);

    // TODO: Is it possible that in a single voronoi_floodfill() call the highest level should be incremented more than once?
    // console.log(`t.available_cell_lengths[t.highest_level_having_seed_cell]: ${t.available_cell_lengths[t.highest_level_having_seed_cell]}`)
    console.log(`t.available_cell_lengths[0]: ${t.available_cell_lengths[0]}`)
    console.log(`t.available_cell_lengths[1]: ${t.available_cell_lengths[1]}`)
    console.log(`t.available_cell_lengths[2]: ${t.available_cell_lengths[2]}`)
    if (t.available_cell_lengths[t.highest_level_having_seed_cell] == 0)
    {
      t.highest_level_having_seed_cell++
    }

    voronoiFloodfill(t.new_seed);

    let quadtree = create_quadtree(voronoi, t.level_count, t.max_side_length);
    compare_results(t.grids, quadtree, t.level_count);
  }

  // console.log(t.grids);
  // console.log(t.available_cell_lengths);

  // console.log(`Got ${t.grids[2][7]}, should be 5`);
  // console.log(`Got ${t.grids[3][22]}, should be 5`);
  // console.log(`Got ${t.grids[3][23]}, should be 5`);

  // debug_draw_grid(t, 3, [142, 42, 142]);
  debug_draw_grid(t, 2, [42, 42, 142]);
  // debug_draw_grid(t, 1, [42, 142, 42]);
  // debug_draw_grid(t, 0, [142, 42, 42]);
}

function compare_results(grids, quadtree, level_count)
{
  let depth;
  let side_length;
  let print_grids_and_quadtree;

  depth = 0;
  side_length = 1;
  print_grids_and_quadtree = false;
  while (depth < level_count)
  {
    i = 0;
    while (i < side_length * side_length)
    {
      if (grids[depth][i] != quadtree[depth][i])
      {
        // console.assert(grids[depth][i] == quadtree[depth][i]);
        console.assert(false, `${grids[depth][i]} != ${quadtree[depth][i]} on depth ${depth} at index ${i}`);
        print_grids_and_quadtree = true;
      }
      i++;
    }
    side_length *= 2;
    depth++;
  }
  if (print_grids_and_quadtree)
  {
    console.log(grids);
    console.log(quadtree);
  }
}

function debug_draw_grid(t, level, color_)
{
  let squares_per_side;
  let square_side_length;

  noFill();
  strokeWeight(3);
  stroke(color_);
  squares_per_side = rt_pow2(level);
  square_side_length = t.max_side_length / squares_per_side * PIXEL_SCALE;
  for (let y = 0; y < squares_per_side; y++)
  {
    for (let x = 0; x < squares_per_side; x++)
    {
      square(x * square_side_length, y * square_side_length, square_side_length);
    }
  }
}

function print_array(array)
{
  let str = "";

  for (let i = 0; i < array.length; i++) {
    str += array[i] + ",";
  }

  console.log(`[${str}]`);
}

// function draw() {
//   for (let loop_index = 0; loop_index < LOOPS_PER_DRAW; loop_index++)
//   {
//     if (? == 0)
//     {
//       noLoop();
//       console.log("Finished");
//       return;
//     }

//     fill(random(100, 200), random(100, 200), random(100, 200));
//     // Do floodfill

//     // fill(240, 240, 240);
//     // circle(x * PIXEL_SCALE + HALF_PIXEL_SCALE, y * PIXEL_SCALE + HALF_PIXEL_SCALE, HALF_PIXEL_SCALE);
//   }

//   fill("#424242");
//   rect(0, 0, 47, 32);
//   fill("#F0F0F0");
//   text(`FPS: ${floor(frameRate())}`, 2, 12);
//   text(`r: ${updateRadius}`, 2, 27);
// }

function rt_log2(n)
{
  let result;

  result = 0;
  while (n > 0)
  {
    n = Math.floor(n / 2);
    result++;
  }
  return (result);
}

function rt_pow2(n)
{
  let result;

  result = 1;
  while (n > 0)
  {
    result *= 2;
    n--;
  }
  return (result);
}

function init_grids(level_count)
{
  // In C: t.grids = ft_calloc(level_count, sizeof(*grids))
  let grids = [];

  let level_index;
  let level_size;
  let grid_level;
  let inner_level_index;

  level_index = 0;
  while (level_index < level_count)
  {
    level_size = rt_pow2(level_index);
    level_size *= level_size;

    // In C: grids[level_index] = ft_calloc(level_size, sizeof(*t.grids[level_index]))
    grids[level_index] = [];

    grid_level = grids[level_index];
    inner_level_index = 0;
    while (inner_level_index < level_size)
    {
      grid_level[inner_level_index] = P;
      inner_level_index++;
    }

    level_index++;
  }

  return (grids);
}

function init_available_cells(t)
{
  let available_cells;
  let available_cells_level;
  let level_index;
  let level_size;
  let inner_level_index;

  // In C: uint32_t **available_cells = ft_calloc(t.level_count, sizeof(*available_cells))
  available_cells = [];

  level_index = 0;
  while (level_index < t.level_count)
  {
    level_size = rt_pow2(level_index);
    level_size *= level_size;

    // In C: available_cells[level_index] = ft_calloc(level_size, sizeof(*available_cells[level_index]))
    available_cells[level_index] = [];

    available_cells_level = available_cells[level_index];
    inner_level_index = 0;
    while (inner_level_index < level_size)
    {
      available_cells_level[inner_level_index] = inner_level_index;
      inner_level_index++;
    }

    level_index++;
  }

  return (available_cells);
}

function init_available_cell_lengths(t)
{
  let level_index;
  let level_size;

  // In C: size_t *available_cell_lengths = ft_calloc(t.level_count, sizeof(*available_cell_lengths))
  t.available_cell_lengths = [];

  level_index = 0;
  while (level_index < t.level_count)
  {
    level_size = rt_pow2(level_index);
    level_size *= level_size;

    t.available_cell_lengths[level_index] = level_size;

    level_index++;
  }
}

function get_seed_valued_cell_index(t)
{
  let available_index;
  let seed_valued_cell_index;

  // In C: available_index = rt_random(t.available_cell_lengths[t.highest_level_having_seed_cell]);
  available_index = floor(random(t.available_cell_lengths[t.highest_level_having_seed_cell]));
  console.log(`available_index: ${available_index}`);

  // print_array(t.available_cells[t.highest_level_having_seed_cell]);
  // print_array(t.available_cells_inverse[t.highest_level_having_seed_cell]);
  seed_valued_cell_index = t.available_cells[t.highest_level_having_seed_cell][available_index];

  // TODO: Is this ever necessary?
  // remove_available(t, available_index, t.highest_level_having_seed_cell);

  return (seed_valued_cell_index);
}

function swap_remove(index, end_index, array, inverse_array)
{
  let old = array[index];
  let new_ = array[end_index];

  array[index] = new_;

  inverse_array[new_] = index;

  // These are for debugging purposes only.
  array[end_index] = -1;
  inverse_array[index] = -1;

  // console.log(index, end_index, old, new_);
  // print_array(array);
  // print_array(inverse_array);
  // console.log();
}

// 4. grids[0][0] has the value 9. Keep recursing into it and find a seed index. If 9 is found, pick 9 - 1 (- since 9 is odd: if we didn't want 8, pick 8 + 1). Let's say the new seed is 63.
// function get_new_seed(seed, seed_valued_cell_index, highest_level_having_seed_cell, side_length, max_side_length, level_count)
function get_new_seed(t, seed_valued_cell_index)
{
  let side_length;
  let new_seed_x;
  let new_seed_y;
  let new_seed;
  let level;
  let picked_lower;
  let picked_right;

  side_length = t.side_length;
  pixels_per_cell = t.max_side_length / side_length;
  new_seed_x = get_cell_pixel_index_x(seed_valued_cell_index, side_length, pixels_per_cell);
  new_seed_y = get_cell_pixel_index_y(seed_valued_cell_index, side_length, pixels_per_cell);

  // console.log(side_length);
  // console.log(new_seed_x);
  // console.log(new_seed_y);
  // console.log(t.highest_level_having_seed_cell);
  // console.log(t.level_count);

  level = t.highest_level_having_seed_cell;
  // console.log(level);
  while (level < t.level_count - 1)
  {
    // TODO: May need to do these at the end?
    new_seed_x *= 2;
    new_seed_y *= 2;

    // In C: picked_right = rt_random(2);
    picked_right = floor(random(2));
    // picked_right = 1;
    if (picked_right)
    {
      new_seed_x++;
    }

    // In C: picked_lower = rt_random(2);
    picked_lower = floor(random(2));
    // picked_lower = 1;
    if (picked_lower)
    {
      new_seed_y++;
    }

    side_length *= 2;

    // console.log(new_seed_x, new_seed_y);

    level++;
  }

  new_seed = new_seed_x + new_seed_y * t.max_side_length;
  // console.log(new_seed);

  // TODO: Check both the ++ and -- cases for whether they resolve seed collisions properly.
  if (new_seed == t.new_seed)
  {
    if (new_seed % 2 == 0)
    {
      // console.log(`new_seed was ${new_seed}`)
      new_seed++;
    }
    else
    {
      // console.log(`new_seed was ${new_seed}`)
      new_seed--;
    }
  }

  return (new_seed);
}

function get_cell_pixel_index_x(cell_index, side_length, pixels_per_cell)
{
  return (get_x(cell_index, side_length) * pixels_per_cell);
}

function get_cell_pixel_index_y(cell_index, side_length, pixels_per_cell)
{
  // TODO: using get_y() may be wrong here, since 63 / 1 -> 63, while 0 was probably wanted?
  // TODO: Check every other spot calling get_y() to make sure they don't suffer from this issue.
  return (get_y(cell_index, side_length) * pixels_per_cell);
}

// Optimization: I reckon it should be possible to do this without a loop.
function get_start_cell_x(seed, side_length, max_side_length)
{
  let x;

  x = get_x(seed, max_side_length);
  // console.log(x);

  while (max_side_length > side_length)
  {
    x = floor(x / 2);
    // console.log(x, max_side_length, side_length);
    max_side_length = floor(max_side_length / 2);
  }

  return (x);
}

// Optimization: I reckon it should be possible to do this without a loop.
function get_start_cell_y(seed, side_length, max_side_length)
{
  let y;

  y = get_y(seed, max_side_length);
  // console.log(y);

  while (max_side_length > side_length)
  {
    y = floor(y / 2);
    // console.log(y, max_side_length, side_length);
    max_side_length = floor(max_side_length / 2);
  }

  return (y);
}
