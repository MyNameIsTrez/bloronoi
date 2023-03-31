// function voronoi_floodfill(new_seed, start_cell_x, start_cell_y, grids, highest_level_having_seed_cell, side_length, max_side_length, level_count, available_cells, available_cell_lengths, available_cells_inverse)
function voronoi_floodfill(t, start_cell_x, start_cell_y)
{
  let i;
  let cell_x;
  let cell_y;
  let cell_index;
  let cell_seed;
  let corner_count;
  
  // console.log(start_cell_x, start_cell_y, t.new_seed, t.grids, t.highest_level_having_seed_cell, t.side_length, t.max_side_length, t.level_count);
  
  t.stack = [];  
  t.stack.push([start_cell_x, start_cell_y]);
  
  t.visited = [];
  i = 0;
  while (i < t.side_length * t.side_length)
  {
      t.visited[i] = false;
      i++;
  }

  while (t.stack.length > 0)
  {
    position = t.stack.pop();
    cell_x = position[0];
    cell_y = position[1];
    
    // console.log(cell_x, cell_y);
    
    cell_index = get_index(cell_x, cell_y, t.side_length);

    t.visited[cell_index] = true;

    cell_seed = t.grids[t.highest_level_having_seed_cell][cell_index];
    // console.log(`cell_index: ${cell_index}, cell_seed: ${cell_seed}`);
        
    // console.log(`cell_index: ${cell_index}, cell_seed: ${cell_seed}, corner_count: ${corner_count}`);
    
    if (cell_seed == C)
    {
      // console.log("C cell");
      
      if (get_c_corner_count_closer_to_new_seed(t, cell_index) == 4)
      {
        draw_square(t, cell_index, t.side_length);
        recursively_set_children_to_p(t, t.highest_level_having_seed_cell, cell_index, t.side_length);
        t.grids[t.highest_level_having_seed_cell][cell_index] = t.new_seed;
        t.available_cell_lengths[t.highest_level_having_seed_cell]++;
        push_neighbor_cells(t, cell_x, cell_y);
      }
      else
      {
        place_new_seed_in_c_cell(t, t.highest_level_having_seed_cell, cell_index, t.side_length);
        // TODO: Call push_neighbor_cells()?
      }
    }
    else if (cell_seed == P)
    {
      // console.log("P cell");
      
      // TODO: What should be done if the corner count is 4?
      
      place_new_seed_around_p_cell(t, t.highest_level_having_seed_cell, cell_index);
      // TODO: Call push_neighbor_cells()?
    }
    else
    {
      corner_count = get_corner_count_closer_to_new_seed(t, cell_seed, cell_index, t.side_length);
      
      if (corner_count == 4)
      {
        // console.log("4 corners closer to new seed");
        draw_square(t, cell_index, t.side_length);
        t.grids[t.highest_level_having_seed_cell][cell_index] = t.new_seed;
        push_neighbor_cells(t, cell_x, cell_y);
      }
      else if (corner_count >= 1 && corner_count <= 3)
      {
        // console.log("1, 2, or 3 corners closer to new seed");
        place_new_seed_in_seed_cell(t, cell_seed, t.highest_level_having_seed_cell, cell_index, t.side_length);

        push_neighbor_cells(t, cell_x, cell_y);
      }
      else
      {
        // console.log("All corners further away from new seed");
      }
    }
  }
}

function recursively_set_children_to_p(t, level_index, cell_index, side_length)
{
  let cell_seed;
  let cell_x;
  let cell_y;
  
  cell_seed = t.grids[level_index][cell_index];
  t.grids[level_index][cell_index] = P;
  if (cell_seed == C)
  {
    cell_x = get_x(cell_index, side_length);
    cell_y = get_y(cell_index, side_length);
    cell_index = get_index(cell_x * 2, cell_y * 2, side_length * 2);
    
    level_index++;
    side_length *= 2;
    
    recursively_set_children_to_p(t, level_index, cell_index, side_length);
    recursively_set_children_to_p(t, level_index, cell_index + 1, side_length);
    recursively_set_children_to_p(t, level_index, cell_index + side_length, side_length);
    recursively_set_children_to_p(t, level_index, cell_index + side_length + 1, side_length);
  }
}

// Only ever call this function on a cell that has the value P.
//
// A cell marked P points to its parent/its parent's parent/etc., so to know whether a cell marked P should be changed to a C or the new seed,
// the old seed has to be gotten by walking up the parent chain until a seed valued cell is encountered.
// If at least one of the four pixel corners of the original P marked cell are closer to the new seed,
// go back up to the upper parent, mark it C, and recursively update everything inside it.
function place_new_seed_around_p_cell(t, level_index, cell_index)
{
  let cell_x;
  let cell_y;
  let side_length;
  let old_seed;
  
  side_length = t.side_length;
  
  // Walk up the parent line until a seed-valued cell is encountered.
  while (true)
  {
    level_index--;
    
    cell_x = get_x(cell_index, side_length);
    cell_y = get_y(cell_index, side_length);

    side_length = floor(side_length / 2);
    
    // TODO: The floor() that get_y() contains will cause cell_y to be floor()ed twice, which may be wrong!
    cell_index = get_index(floor(cell_x / 2), floor(cell_y / 2), side_length);
    
    if (t.grids[level_index][cell_index] != P)
      break ;
  }
  
  old_seed = t.grids[level_index][cell_index];
  
  corner_count = get_corner_count_closer_to_new_seed(t, old_seed, cell_index, side_length);
  
  if (corner_count > 0)
  {
    mark_c(t, level_index, cell_index);
    
    place_new_seed_in_c_cell(t, level_index, cell_index, side_length);
  }
}

// This function assumes that cell_index hasn't already been removed from available_cells.
function mark_c(t, level_index, cell_index)
{
  let available_index;
  
  t.grids[level_index][cell_index] = C;
  
  available_index = t.available_cells_inverse[level_index][cell_index];
  // console.log(`level_index: ${level_index}, cell_index: ${cell_index}, available_index: ${available_index}`);
  remove_available(t, available_index, level_index);
}

function remove_available(t, available_index, level_index)
{
  swap_remove(available_index, t.available_cell_lengths[level_index] - 1, t.available_cells[level_index], t.available_cells_inverse[level_index]);
  t.available_cell_lengths[level_index]--;
}

// Only ever call this function on a C cell.
function place_new_seed_in_c_cell(t, level_index, cell_index, side_length)
{
  let cell_seed;
  let cell_x;
  let cell_y;
  
  cell_seed = t.grids[level_index][cell_index];
  if (cell_seed == C)
  {
    cell_x = get_x(cell_index, side_length);
    cell_y = get_y(cell_index, side_length);
    cell_index = get_index(cell_x * 2, cell_y * 2, side_length * 2);
    
    level_index++;
    side_length *= 2;
    
    place_new_seed_in_c_cell(t, level_index, cell_index, side_length);
    place_new_seed_in_c_cell(t, level_index, cell_index + 1, side_length);
    place_new_seed_in_c_cell(t, level_index, cell_index + side_length, side_length);
    place_new_seed_in_c_cell(t, level_index, cell_index + side_length + 1, side_length);
  }
  else
  {
    place_new_seed_in_seed_cell(t, cell_seed, level_index, cell_index, side_length);
  }
}

// Only ever call this function on a cell that is seed-valued (so don't call it on a C or P cell).
function place_new_seed_in_seed_cell(t, old_seed, level_index, cell_index, side_length)
{
  let cell_seed;
  let corner_count;
  let cell_x;
  let cell_y;
  
  // console.log(t.new_seed, old_seed, cell_index, level_index, t.level_count, side_length, t.grids)
  
  t.grids[level_index][cell_index] = old_seed;
  
  corner_count = get_corner_count_closer_to_new_seed(t, old_seed, cell_index, side_length);
  
  // if (cell_index == 36) console.log(`!!!!!!!!!!!!! corner_count: ${corner_count}`);
  // if (cell_index == 10) console.log(`!!!!!!!!!!!!! corner_count: ${corner_count}`);

  // When the pixel level has been reached, corner_count will always be either 0 or 4.
  if (corner_count == 4)
  {
    // console.log(`place_new_seed_in_seed_cell(): 4 corners closer to new seed at cell_index ${cell_index}`);
    draw_square(t, cell_index, side_length);
    t.grids[level_index][cell_index] = t.new_seed;
  }
  else if (corner_count >= 1 && corner_count <= 3)
  {
    // console.log("place_new_seed_in_seed_cell(): 1 to 3 corners closer to new seed")
    mark_c(t, level_index, cell_index);
    
    cell_x = get_x(cell_index, side_length);
    cell_y = get_y(cell_index, side_length);
    
    level_index++;
    side_length *= 2;
    
    cell_index = get_index(cell_x * 2, cell_y * 2, side_length);

    place_new_seed_in_seed_cell(t, old_seed, level_index, cell_index, side_length);
    place_new_seed_in_seed_cell(t, old_seed, level_index, cell_index + 1, side_length);
    place_new_seed_in_seed_cell(t, old_seed, level_index, cell_index + side_length, side_length);
    place_new_seed_in_seed_cell(t, old_seed, level_index, cell_index + side_length + 1, side_length);
  }
}

// TODO: Limit the square so it doesn't try to draw outside of the canvas.
function draw_square(t, cell_index, side_length)
{
  let pixels_per_cell;
  
  // console.log(`cell_index: ${cell_index}, side_length: ${side_length}`);
  pixels_per_cell = t.max_side_length / side_length;
  pixel_index_x = get_cell_pixel_index_x(cell_index, side_length, pixels_per_cell);
  pixel_index_y = get_cell_pixel_index_y(cell_index, side_length, pixels_per_cell);
  // console.log(`cell_index: ${cell_index}, t.max_side_length: ${t.max_side_length}, side_length: ${side_length}, pixels_per_cell: ${pixels_per_cell}, pixel_index_x: ${pixel_index_x}, pixel_index_y: ${pixel_index_y}, pixels_per_cell * PIXEL_SCALE: ${pixels_per_cell * PIXEL_SCALE}`);
  // square(pixel_index_x * PIXEL_SCALE, pixel_index_y * PIXEL_SCALE, pixels_per_cell * PIXEL_SCALE);
}

function get_index(x, y, side_length)
{
  return x + y * side_length;
}

// Only ever call this function on a C cell.
function get_c_corner_count_closer_to_new_seed(t, cell_index)
{
  let pixels_per_cell;
  let cell_pixel_index_x;
  let cell_pixel_index_y;
  let pixel_index;
  let pixel_offset_right;
  let pixel_offset_bottom;
  
  pixels_per_cell = t.max_side_length / t.side_length;
  pixel_index_x = get_cell_pixel_index_x(cell_index, t.side_length, pixels_per_cell);
  pixel_index_y = get_cell_pixel_index_y(cell_index, t.side_length, pixels_per_cell);
  pixel_index = pixel_index_x + pixel_index_y * t.max_side_length;
  
  pixel_offset_right = pixels_per_cell - 1;
  pixel_offset_bottom = (pixels_per_cell - 1) * t.max_side_length;
  
  // TODO: When the pixel level has been reached, it's wasteful that these four identical
  // function calls are being done.
  // Profile whether having an early-return if-statement is faster.
  
  return (is_corner_closer_to_new_seed(pixel_index, t.grids[t.level_count - 1][pixel_index], t.new_seed, t.max_side_length) +
    is_corner_closer_to_new_seed(pixel_index + pixel_offset_right, t.grids[t.level_count - 1][pixel_index + pixel_offset_right], t.new_seed, t.max_side_length) +
    is_corner_closer_to_new_seed(pixel_index + pixel_offset_bottom, t.grids[t.level_count - 1][pixel_index + pixel_offset_bottom], t.new_seed, t.max_side_length) +
    is_corner_closer_to_new_seed(pixel_index + pixel_offset_bottom + pixel_offset_right, t.grids[t.level_count - 1][pixel_index + pixel_offset_bottom + pixel_offset_right], t.new_seed, t.max_side_length));
}

// Only ever call this function on a cell that is seed-valued (so don't call it on a C or P cell).
function get_corner_count_closer_to_new_seed(t, old_seed, cell_index, side_length)
{
  let pixels_per_cell;
  let cell_pixel_index_x;
  let cell_pixel_index_y;
  let pixel_index;
  let pixel_offset_right;
  let pixel_offset_bottom;
  
  pixels_per_cell = t.max_side_length / side_length;
  pixel_index_x = get_cell_pixel_index_x(cell_index, side_length, pixels_per_cell);
  pixel_index_y = get_cell_pixel_index_y(cell_index, side_length, pixels_per_cell);
  pixel_index = pixel_index_x + pixel_index_y * t.max_side_length;
  
  pixel_offset_right = pixels_per_cell - 1;
  pixel_offset_bottom = (pixels_per_cell - 1) * t.max_side_length;
  
  // TODO: When the pixel level has been reached, it's wasteful that these four identical
  // function calls are being done.
  // Profile whether having an early-return if-statement is faster.
  
  return (is_corner_closer_to_new_seed(pixel_index, old_seed, t.new_seed, t.max_side_length) +
    is_corner_closer_to_new_seed(pixel_index + pixel_offset_right, old_seed, t.new_seed, t.max_side_length) +
    is_corner_closer_to_new_seed(pixel_index + pixel_offset_bottom, old_seed, t.new_seed, t.max_side_length) +
    is_corner_closer_to_new_seed(pixel_index + pixel_offset_bottom + pixel_offset_right, old_seed, t.new_seed, t.max_side_length));
}

function is_corner_closer_to_new_seed(pixel_index, old_seed, new_seed, max_side_length)
{
  // console.log(pixel_index, t.new_seed, old_seed, t.level_count, t.max_side_length, t.grids);
  return (get_distance_squared(new_seed, pixel_index, max_side_length) <
          get_distance_squared(old_seed, pixel_index, max_side_length));
}

function get_distance_squared(index_1, index_2, max_side_length)
{
  let dx;
  let dy;
  
  dx = get_x(index_1, max_side_length) - get_x(index_2, max_side_length);
  dy = get_y(index_1, max_side_length) - get_y(index_2, max_side_length);
  return (dx * dx + dy * dy);
}

function get_x(index, side_length)
{
  return (index % side_length);
}

function get_y(index, side_length)
{
  return (floor(index / side_length));
}

function push_neighbor_cells(t, cell_x, cell_y)
{
  // console.log(cell_x, cell_y, t.visited, side_length, t.stack);
  
  // Top
  if (cell_y - 1 >= 0 && is_unvisited(t, cell_x, cell_y - 1))
  {
    t.stack.push([cell_x, cell_y - 1]);
  }
  // Bottom
  if (cell_y + 1 < t.side_length && is_unvisited(t, cell_x, cell_y + 1))
  {
    t.stack.push([cell_x, cell_y + 1]);
  }
  // Left
  if (cell_x - 1 >= 0 && is_unvisited(t, cell_x - 1, cell_y))
  {
    t.stack.push([cell_x - 1, cell_y]);
  }
  // Right
  if (cell_x + 1 < t.side_length && is_unvisited(t, cell_x + 1, cell_y))
  {
    t.stack.push([cell_x + 1, cell_y]);
  }
  
  // Top-left
  if (cell_x - 1 >= 0 && cell_y - 1 >= 0 && is_unvisited(t, cell_x - 1, cell_y - 1))
  {
    t.stack.push([cell_x - 1, cell_y - 1]);
  }
  // Top-right
  if (cell_x + 1 < t.side_length && cell_y - 1 >= 0 && is_unvisited(t, cell_x + 1, cell_y - 1))
  {
    t.stack.push([cell_x + 1, cell_y - 1]);
  }
  // Bottom-left
  if (cell_x - 1 >= 0 && cell_y + 1 < t.side_length && is_unvisited(t, cell_x - 1, cell_y + 1))
  {
    t.stack.push([cell_x - 1, cell_y + 1]);
  }
  // Bottom-right
  if (cell_x + 1 < t.side_length && cell_y + 1 < t.side_length && is_unvisited(t, cell_x + 1, cell_y + 1))
  {
    t.stack.push([cell_x + 1, cell_y + 1]);
  }
}

function is_unvisited(t, cell_x, cell_y)
{
  return !t.visited[get_index(cell_x, cell_y, t.side_length)];
}
