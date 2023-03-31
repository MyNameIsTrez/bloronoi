// TODO: In C, reset this in rt_reset_canvas_info()
const voronoi = [];

function voronoiFloodfill(seed) {
  let startX = seed % WIDTH;
  let startY = floor(seed / WIDTH);

  // Do this with ft_vector
  // Use structs in C
  const stack = [[startX, startY]];

  voronoi[getIndex(startX, startY)] = seed;

  // In C, do this with an ft_calloc()'ed bool array
  // DO NOT do it on the stack, since it can be huge!
  const visited = [];

  while (stack.length > 0) {
    position = stack.pop();
    const x = position[0];
    const y = position[1];
    // console.log(x, y);
    square(x * PIXEL_SCALE, y * PIXEL_SCALE, PIXEL_SCALE);

    visited[getIndex(x, y)] = true;

    if (y - 1 >= 0 && isValid(x, y - 1, visited, voronoi, startX, startY)) {
      stack.push([x, y - 1]);
    }
    if (y + 1 < HEIGHT && isValid(x, y + 1, visited, voronoi, startX, startY)) {
      stack.push([x, y + 1]);
    }
    if (x - 1 >= 0 && isValid(x - 1, y, visited, voronoi, startX, startY)) {
      stack.push([x - 1, y]);
    }
    if (x + 1 < WIDTH && isValid(x + 1, y, visited, voronoi, startX, startY)) {
      stack.push([x + 1, y]);
    }
  }

  // console.log(voronoi);
}

function isValid(x, y, visited, voronoi, startX, startY) {
  const index = getIndex(x, y);
  return !visited[index] && isCloser(startX, startY, x, y, voronoi, index);
}

function getIndex(x, y) {
  return x + y * WIDTH;
}

function isCloser(startX, startY, x, y, voronoi, index) {
  const old_seed = voronoi[index];
  const old_dist = getSqDist(old_seed % WIDTH, floor(old_seed / WIDTH), x, y);
  const new_dist = getSqDist(startX, startY, x, y);
  if (new_dist < old_dist)
  {
    new_seed = startX + startY * WIDTH;
    voronoi[index] = new_seed;
    return true;
  }
  return false;
}

function getSqDist(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function create_quadtree(voronoi, level_count, max_side_length)
{
  let quadtree = init_grids(level_count);

  init_quadtree(0, 0, 0, 1, voronoi, quadtree, max_side_length);

  return (quadtree);
}

function init_quadtree(x, y, depth, side_length, voronoi, quadtree, max_side_length)
{
  if (all_corners_have_same_seed(x, y, depth, side_length, max_side_length, voronoi))
  {
    quadtree[depth][x + y * side_length] = get_top_left_corner_seed(x, y, side_length, max_side_length, voronoi);
  }
  else
  {
    quadtree[depth][x + y * side_length] = C;

    x *= 2;
    y *= 2;
    depth++;
    side_length *= 2;

    init_quadtree(x, y, depth, side_length, voronoi, quadtree, max_side_length);
    init_quadtree(x + 1, y, depth, side_length, voronoi, quadtree, max_side_length);
    init_quadtree(x, y + 1, depth, side_length, voronoi, quadtree, max_side_length);
    init_quadtree(x + 1, y + 1, depth, side_length, voronoi, quadtree, max_side_length);
  }
}

function all_corners_have_same_seed(x, y, depth, side_length, max_side_length, voronoi)
{
  let pixels_per_cell;
  let cell_pixel_index_x;
  let cell_pixel_index_y;
  let pixel_index;
  let pixel_offset_right;
  let pixel_offset_bottom;

  let cell_index = x + y * side_length;
  pixels_per_cell = max_side_length / side_length;
  pixel_index_x = get_cell_pixel_index_x(cell_index, side_length, pixels_per_cell);
  pixel_index_y = get_cell_pixel_index_y(cell_index, side_length, pixels_per_cell);
  pixel_index = pixel_index_x + pixel_index_y * max_side_length;

  pixel_offset_right = pixels_per_cell - 1;
  pixel_offset_bottom = (pixels_per_cell - 1) * max_side_length;

  let top_left = voronoi[pixel_index];
  let top_right = voronoi[pixel_index + pixel_offset_right];
  let bottom_left = voronoi[pixel_index + pixel_offset_bottom];
  let bottom_right = voronoi[pixel_index + pixel_offset_bottom + pixel_offset_right];
  return (top_left == top_right && top_right == bottom_left && bottom_left == bottom_right);
}

function get_top_left_corner_seed(x, y, side_length, max_side_length, voronoi)
{
  let cell_index = x + y * side_length;
  let pixels_per_cell = max_side_length / side_length;
  let pixel_index_x = get_cell_pixel_index_x(cell_index, side_length, pixels_per_cell);
  let pixel_index_y = get_cell_pixel_index_y(cell_index, side_length, pixels_per_cell);
  return (voronoi[pixel_index_x + pixel_index_y * max_side_length]);
}
