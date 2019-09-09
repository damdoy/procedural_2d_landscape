function draw_lake(pos_x, pos_y, width, height, context_layer, ctx){
   context_layer.strokeStyle = "#000000";
   context_layer.fillStyle = "#0000FF";

   var startx = pos_x-width;
   var endx = pos_x+width;
   var starty = pos_y-height;
   var endy = pos_y+height;

   // context_layer.beginPath();
   // context_layer.ellipse(pos_x, pos_y, width, height, 0, 0, 2*Math.PI);
   // context_layer.fill();

   context_layer.strokeStyle = "#000000";

   for (var x = startx; x <= endx; x++) {
      for(var y = starty; y <= endy; y++) {
         var pixel = ctx.getImageData(x, starty-(y-starty)*4, 1, 1);
         // context_layer.fillStyle = "#FF000030";
         context_layer.fillStyle = "rgba("+pixel.data[0]+","+pixel.data[1]+","+(pixel.data[2]*0.5+200)+","+0x80+")"
         context_layer.fillRect(x, y, 1, 1);
         // context_layer.fillStyle = "rgba(0, 0, 127, 127)"
         // context_layer.fillRect(x, y, 1, 1);
      }
   }
}

function draw_leaves(pos_x, pos_y, radius, dir_sun, nb_leaves, ctx){
   // ctx.fillStyle = "rgba("+pixel.data[0]+","+pixel.data[1]+","+(pixel.data[2]*0.5+200)+","+0x80+")"

   // var nb_leaves = 15 //due to high number of branches in tress, this number can make the total amount of leaves explose, keep it low
   for (var i = 0; i < nb_leaves; i++) {
      var depth = 1-(i/nb_leaves)
      var offsetx = (Math.random()*2-1)*radius/2;
      var offsety = (Math.random()*2-1)*radius/2;
      var posx = pos_x+offsetx;
      var posy = pos_y+offsety;

      //are the leaves exposed to sunlight (with dir_sun vector?)
      var exposed = ((offsetx*dir_sun[0]+offsety*dir_sun[1])>0?1:0.4)
      // var dist_from_centre = Math.sqrt(offsetx*offsetx+offsety*offsety);
      //make leaves in the back, darker, as well as the unexposed ones to give depth
      ctx.fillStyle = "rgba("+(15+15*(1-depth))+","+(80+80*(1-depth))*exposed+","+0x0+","+0xFF+")"
      ctx.beginPath();
      //half elipse will make good enough leaves
      ctx.ellipse(posx, posy, radius/3, radius/10, Math.PI*Math.random(), 0, 2*Math.PI);
      ctx.fill();
   }
}

//kind of a L-system tree
function draw_trunk(startx, starty, angle, level, max_level, length, original_length, rand_numbers, end_branch, sun_dir, local_ctx){

   if(level >= max_level){
      local_ctx.strokeStyle = "#000000";
      local_ctx.fillStyle = "#FFFFFF"; //black trunks are good enough, but can be experimented
      local_ctx.lineWidth = length/15;

      local_ctx.beginPath();
      local_ctx.moveTo(startx, starty);
      local_ctx.lineTo(startx+length*Math.sin(angle), starty+length*Math.cos(angle));
      local_ctx.stroke();

      //if this is an end branch, draw the leaves
      if(end_branch == true){
         var pos_end = [startx+length*Math.sin(angle), starty+length*Math.cos(angle)];

         //leaves circles
         // {
         //    local_ctx.strokeStyle = "#000000";
         //    local_ctx.fillStyle = "#00FF0080";
         //    local_ctx.beginPath();
         //    local_ctx.arc(pos_end[0], pos_end[1], original_length/6, 0, 2*Math.PI);
         //    local_ctx.fill();
         // }

         //trees in the back will have less leaves
         var nb_leaves = 10+Math.ceil(0.2*length)
         draw_leaves(pos_end[0], pos_end[1], original_length/4, sun_dir, nb_leaves, local_ctx)

      }

      return;
   }

   //base trunk, unchanged, give it a level of 1000 to be drawn immediately
   var cur_angle = angle;
   draw_trunk(startx, starty, angle, level+1000, max_level, length, original_length, rand_numbers, false, sun_dir, local_ctx);
   var cur_pos = [startx+length*Math.sin(angle), starty+length*Math.cos(angle)];

   //branch at the top of the trunk
   {
      var new_angle_increment = 3.1415/10*rand_numbers[0];
      var new_angle = cur_angle+new_angle_increment;
      // var new_pos = [cur_pos[0]+length*Math.sin(new_angle), cur_pos[1]+length*Math.cos(new_angle)];
      draw_trunk(cur_pos[0], cur_pos[1], new_angle, level+1, max_level, length*0.8, original_length, rand_numbers, true, sun_dir, local_ctx);
   }

   //next two branches should be on the two sides of the trunk, enforce it with a variable
   var branch_dir = 1;
   if (rand_numbers < 0.5){
      branch_dir = -1;
   }

   //side_trunk
   {
      var new_angle_increment = 3.1415/3*(rand_numbers[1]/2+0.5)*branch_dir;
      var new_angle = cur_angle+new_angle_increment;
      var start_length = length*((rand_numbers[2]/2+0.5)*0.4+0.5)
      var cur_pos = [startx+start_length*Math.sin(angle), starty+start_length*Math.cos(angle)];
      // var new_pos = [cur_pos[0]+length*Math.sin(new_angle), cur_pos[1]+length*Math.cos(new_angle)];
      draw_trunk(cur_pos[0], cur_pos[1], new_angle, level+1, max_level, length*0.6, original_length, rand_numbers, true, sun_dir, local_ctx);
   }

   //side_trunk
   {
      var new_angle_increment = 3.1415/2*(rand_numbers[3]/2+0.5)*-branch_dir;
      var new_angle = cur_angle+new_angle_increment;
      var start_length = length*((rand_numbers[4]/2+0.5)*0.3+0.5)
      var cur_pos = [startx+start_length*Math.sin(angle), starty+start_length*Math.cos(angle)];
      // var new_pos = [cur_pos[0]+length*Math.sin(new_angle), cur_pos[1]+length*Math.cos(new_angle)];
      draw_trunk(cur_pos[0], cur_pos[1], new_angle, level+1, max_level, length*0.5, original_length, rand_numbers, true, sun_dir, local_ctx);
   }
}

function draw_tree(startx, starty, angle, level, max_level, length, sun_dir, local_ctx){

   var rand_numbers = [];

   //prepare an array of random numbers in order to have self repeating branches
   //although we have a recursive algorithm, o/w trees would be only chaotic
   for (var i = 0; i < 32; i++) {
      rand_numbers[i] = Math.random()*2-1;
   }

   draw_trunk(startx, starty, angle, level, max_level, length, length, rand_numbers, true, sun_dir, local_ctx)
}

//simple blurry, half transparent dark ellipse (could be smarter)
function draw_tree_shadow(startx, starty, length, sun_dir, local_ctx){

   local_ctx.fillStyle = "rgba("+0x00+","+0x00+","+0x00+","+0.5+")"
   local_ctx.filter = 'blur('+8+'px)';

   local_ctx.beginPath();
   //give a slight offset to the shadow on the x direction
   local_ctx.ellipse(Math.floor(startx-(sun_dir[0]*startx)*0.05), starty, length, length/8, 0, 0, 2*Math.PI);
   local_ctx.fill();

   local_ctx.filter = 'blur('+0+'px)';

   // local_ctx.ellipse(startx-length/2, starty, length/2, length/8, 0, 0, 2*Math.PI);

}

//angle left should be negative
//angle ridge can be whatever but should be between left and right
function draw_mountain(posx, posy, angle_left, angle_right, angle_ridge, height, max_height, sun_dir, local_ctx){
   local_ctx.strokeStyle = "#000000";
   local_ctx.fillStyle = "#DFDFDF";

   //multiplication to simulate crude gaussian
   var random_col_variation = (Math.random()*2-1)*(Math.random()*2-1);

   var grass_red = Math.floor(24+8*random_col_variation)
   var grass_green = Math.floor(140+36*random_col_variation)
   var grass_blue = Math.floor(40+8*random_col_variation)

   var snow_height = height-110+30*Math.random();
   snow_height = (snow_height<0)?0:snow_height

   //gives variety, snow can be a bit gray
   var snow_colour = 0xD0 + Math.random()*0x2F;

   var left_middle_angle = (angle_left+angle_ridge)/2

   //substract 90deg to the angle between left side and the ridge to get a normal vector
   var left_side_normal_angle = left_middle_angle-Math.PI/2;
   var left_side_normal_vector = [Math.cos(left_side_normal_angle), Math.sin(left_side_normal_angle)];
   var light_strength_left = sun_dir[0]*left_side_normal_vector[0]+sun_dir[1]*left_side_normal_vector[1];
   if(light_strength_left < 0.3){
      light_strength_left = 0.3; //dont make it completely dark in case it is hidden ==> simulates ambiant light
   }
   var height_ratio = height/150;
   height_ratio = (height_ratio>1)?1:height_ratio;
   light_strength_left = height_ratio*light_strength_left+(1-height_ratio)*0.5;

   //var col_left = 0x010101*Math.floor(light_strength_left*0xFF);
   var rgb = [Math.floor(grass_blue*light_strength_left), Math.floor(grass_green*light_strength_left), Math.floor(grass_red*light_strength_left)]
   var col_left = rgb[0]+(rgb[1]<<8)+(rgb[2]<<16)
   var col = '#' + (col_left&0xffffff).toString(16).padStart(6, 0)
   local_ctx.fillStyle = col;
   local_ctx.strokeStyle = local_ctx.fillStyle;

   local_ctx.beginPath();
   local_ctx.moveTo(posx, posy);
   local_ctx.lineTo(posx+Math.tan(angle_left)*height, posy+height);
   local_ctx.lineTo(posx+Math.tan(angle_ridge)*height, posy+height);
   local_ctx.fill();

   var right_middle_angle = (angle_ridge+angle_right)/2

   //substract 90deg to the angle between left side and the ridge to get a normal vector
   var right_side_normal_angle = right_middle_angle-Math.PI/2;
   var right_side_normal_vector = [Math.cos(right_side_normal_angle), Math.sin(right_side_normal_angle)];
   var light_strength_right = sun_dir[0]*right_side_normal_vector[0]+sun_dir[1]*right_side_normal_vector[1];
   if(light_strength_right < 0.3){
      light_strength_right = 0.3; //dont make it completely dark in case it is hidden ==> simulates ambiant light
   }

   var height_ratio = height/150;
   height_ratio = (height_ratio>1)?1:height_ratio;
   light_strength_right = height_ratio*light_strength_right+(1-height_ratio)*0.5;
   var rgb = [Math.floor(grass_blue*light_strength_right), Math.floor(grass_green*light_strength_right), Math.floor(grass_red*light_strength_right)]

   var col_left = rgb[0]+(rgb[1]<<8)+(rgb[2]<<16)
   var col = '#' + (col_left&0xffffff).toString(16).padStart(6, 0)
   local_ctx.fillStyle = col;
   local_ctx.strokeStyle = local_ctx.fillStyle;

   local_ctx.beginPath();
   local_ctx.moveTo(posx, posy);
   local_ctx.lineTo(posx+Math.tan(angle_ridge)*height, posy+height);
   local_ctx.lineTo(posx+Math.tan(angle_right)*height, posy+height);
   local_ctx.fill();

   local_ctx.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   local_ctx.clearRect(0,0,size_canvas[0], posy+snow_height);

   //////////snowtop left
   var red = Math.floor(snow_colour*light_strength_left)
   var green = Math.floor(snow_colour*light_strength_left)
   var blue = Math.floor(snow_colour*light_strength_left)
   var col_left = blue+(green<<8)+(red<<16)
   var col = '#' + (col_left&0xffffff).toString(16).padStart(6, 0)
   local_ctx.fillStyle = col;
   local_ctx.strokeStyle = local_ctx.fillStyle;

   local_ctx.beginPath();
   local_ctx.moveTo(posx, posy);
   local_ctx.lineTo(posx+Math.tan(angle_left)*snow_height, posy+snow_height);
   local_ctx.lineTo(posx+Math.tan(angle_ridge)*snow_height, posy+snow_height);
   local_ctx.fill();

   //////////snowtop right

   var red = Math.floor(snow_colour*light_strength_right)
   var green = Math.floor(snow_colour*light_strength_right)
   var blue = Math.floor(snow_colour*light_strength_right)
   var col_left = blue+(green<<8)+(red<<16)
   var col = '#' + (col_left&0xffffff).toString(16).padStart(6, 0)
   local_ctx.fillStyle = col;
   local_ctx.strokeStyle = local_ctx.fillStyle;

   local_ctx.beginPath();
   local_ctx.moveTo(posx, posy);
   local_ctx.lineTo(posx+Math.tan(angle_ridge)*snow_height, posy+snow_height);
   local_ctx.lineTo(posx+Math.tan(angle_right)*snow_height, posy+snow_height);
   local_ctx.fill();
}

//sine based cloud, give large clouds through the sky (not that realist)
function draw_clouds_sine(local_ctx, sun_dir){
   var rand_orientation_x = Math.random()*10-5
   var rand_orientation_y = Math.random()*10-5
   var total_orientations = Math.sqrt(rand_orientation_x*rand_orientation_x+rand_orientation_y*rand_orientation_y)
   rand_orientation_x /= total_orientations
   rand_orientation_y /= total_orientations
   local_ctx.beginPath();
   for (var x = 0; x < size_canvas[0]; x+=12) {
      for (var y = 0; y < 400; y+=12) {
         var prob_cloud = ((Math.sin((rand_orientation_x*x+rand_orientation_y*y)/100))*0.5+0.5)*2;
         if (Math.random() > prob_cloud){
            var gradientx = rand_orientation_x/100*(Math.cos((rand_orientation_x*x+rand_orientation_y*y)/100));
            var gradienty = rand_orientation_y/100*(Math.cos((rand_orientation_x*x+rand_orientation_y*y)/100));
            var grad_length = Math.sqrt(gradientx*gradientx+gradienty*gradienty);
            var gradient = [gradientx/grad_length, gradienty/grad_length];

            // var cloud_brightness = 1;
            var cloud_brightness = 1;
            var dot_prod = gradient[0]*sun_dir[0]+gradient[1]*sun_dir[1];

            if(dot_prod < 0){
               cloud_brightness -= Math.random()*0.4*Math.abs(dot_prod);
            }


            // cloud_brightness = (gradient[0]*sun_dir[0]+gradient[1]*sun_dir[1])/2+0.5;
            var blue_tint = 0x10*Math.random();

            local_ctx.strokeStyle = "rgba("+(0xFF*cloud_brightness)+","+(0xFF*cloud_brightness)+","+(0xFF*cloud_brightness)+","+0xff+")"
            // local_ctx.strokeStyle = "#FFFFFF"; //white
            local_ctx.fillStyle = local_ctx.strokeStyle; //white
            local_ctx.arc(x,y,12, 0, 2*Math.PI);

         }
      }
   }
   local_ctx.fill();
}

function draw_clouds(local_ctx, sun_dir, scale){

   var prob_array = improved_perlin_noise_recurs(1600, 400, 600*scale, 3);
   // var prob_array = improved_perlin_noise(1600, 400, 100);

   for (var x = 0; x < size_canvas[0]; x+=8) {
      for (var y = 0; y < 400; y+=8) {
         if ( (prob_array[x][y]*10-5) > Math.random() ){

            var gradientx = prob_array[x-1>=0?x-1:0][y]-prob_array[x+1][y];
            var gradienty = prob_array[x][y-1>=0?y-1:0]-prob_array[x][y+1];
            var grad_length = Math.sqrt(gradientx*gradientx+gradienty*gradienty);
            var gradient = [gradientx/grad_length, gradienty/grad_length];

            // var cloud_brightness = (prob_array[x][y]);
            var cloud_brightness = (gradient[0]*sun_dir[0]+gradient[1]*sun_dir[1])*0.2+0.8;

            local_ctx.strokeStyle = "rgba("+(0xFF*cloud_brightness)+","+(0xFF*cloud_brightness)+","+(0xFF*cloud_brightness)+","+1.0+")"
            // local_ctx.strokeStyle = "#FFFFFF"; //white
            local_ctx.fillStyle = local_ctx.strokeStyle;
            local_ctx.beginPath();
            local_ctx.arc(x,y,10*scale, 0, 2*Math.PI);
            local_ctx.fill();
         }
      }
   }
}

function draw_ground(ctx){
   var width = 1600;
   var height = 450;
   var startx = 0;
   var starty = 450;
   ctx.strokeStyle = "rgba("+0x20+","+0xAF+","+0x30+","+0xFF+")"
   ctx.fillStyle = ctx.strokeStyle;

   //make the perlin noise higher than the actual texture as it will be squished
   var noise = improved_perlin_noise_recurs(1600, height*4, 30, 2);
   var imagedata = ctx.createImageData(width, height);
   for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
         var idx = (y*width+x)*4;
         var ratio_y = 1-(y/height);
         //give it a fake perspective by using a sqrt, power is chosen as it seemed to look good
         var y_nonlinear = Math.ceil(Math.pow(ratio_y,1.41)*height*4);
         imagedata.data[idx] = 0x20*(noise[x][y_nonlinear]*0.5+0.5); //red
         imagedata.data[idx+1] = 0xAF*(noise[x][y_nonlinear]*0.5+0.5); //green
         imagedata.data[idx+2] = 0x30*(noise[x][y_nonlinear]*0.5+0.5); //blue
         imagedata.data[idx+3] = 255; //alpha
      }
   }
   ctx.putImageData(imagedata, 0, starty);
}

//TODO without killing performance
function distort_image(context, canvas_size){
   var canvas_distort = document.createElement('canvas');
   canvas_distort.width = canvas_size[0];
   canvas_distort.height = canvas_size[1];
   var context_distort = canvas_distort.getContext('2d');
   context_distort.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_distort.fillRect(0,0,canvas_size[0], canvas_size[1]);

   for (var x = 0; x < canvas_size[0]; x++) {
      for (var y = 0; y < canvas_size[1]; y++) {
         var pixel = context.getImageData(x, y, 1, 1);
         context_distort.fillStyle = "rgba("+pixel.data[0]+","+pixel.data[1]+","+pixel.data[2]+","+pixel.data[3]+")"
         context_distort.fillRect(x,y,1,1);
         Math.sin(x*y)*2
      }
   }

   return canvas_distort
}

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

size_canvas = [1600, 900];
sun_angle = (Math.random()*2-1)*(Math.PI/3)-Math.PI/2; //+- 60 degrees around up vector
sun_dir = [Math.cos(sun_angle), Math.sin(sun_angle)];
// sun_dir = [0, -1]; // sun at the top

//sky
ctx.strokeStyle = "#50A0FF"; //light blue
ctx.fillStyle = ctx.strokeStyle;
ctx.fillRect(0,0,1600, 450);

//grass
{
   var canvas_layer = document.createElement('canvas');
   canvas_layer.width = size_canvas[0];
   canvas_layer.height = size_canvas[1];
   var context_layer = canvas_layer.getContext('2d');
   context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);

   draw_ground(context_layer);

   ctx.drawImage(canvas_layer, 0, 0);
}

//CLOUDS
var max_clouds = 1
for (var i = max_clouds-1; i >= 0; i--){
   var canvas_layer = document.createElement('canvas');
   canvas_layer.width = size_canvas[0];
   canvas_layer.height = size_canvas[1];
   var context_layer = canvas_layer.getContext('2d');
   context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);
   var scale = 1/((i+1)); //make clouds smaller (an blurier)
   draw_clouds(context_layer, sun_dir, scale);
   ctx.filter = 'blur('+(10)+'px)';

   //due to the post drawing blur, some artifacts can appear on the borders of the image
   //avoid that by drawing the image out of bounds and widen it a little
   ctx.drawImage(canvas_layer, -10, -10, size_canvas[0]+20, size_canvas[1]);
   ctx.filter = 'blur('+(0)+'px)';
}

var max_mountains = 100;
//draw far away mountains first
for (var i = 0; i < max_mountains; i++) {
   var canvas_layer = document.createElement('canvas');
   canvas_layer.width = size_canvas[0];
   canvas_layer.height = size_canvas[1];
   var context_layer = canvas_layer.getContext('2d');
   context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);

   var farthness = 1-(i/max_mountains); //how far away a moutain is
   var pos_x = 1600*Math.random();

   //angle of mountains is narrower the farther away it is
   var max_angle = -3.1415/2.2+farthness*3.1415/4.8
   var ridge_random = Math.random();
   var ridge_angle = -max_angle*(1-ridge_random)+max_angle*ridge_random

   //fake perspective, draw more mountains far away than near
   //if farthness is [0, 1] then pow(farthness, 1/8) will have more values >0.75 than <0.75
   var pos_y = 700-400*Math.pow(farthness, 1/8);
   //draw mountain in a layer
   draw_mountain(pos_x, pos_y, max_angle, -max_angle, ridge_angle, (farthness+0.75)*100, (1+0.75)*100, sun_dir, context_layer);

   // var canvas_layer_distorted = distort_image(context_layer, size_canvas)

   // ctx.filter = 'blur('+(farthness)+'px)'; //give a depth of field (not that great)
   ctx.drawImage(canvas_layer, 0, 0);
   // ctx.filter = 'blur('+(0)+'px)';
}

//draw all the trees in a single context not that great
// var canvas_layer = document.createElement('canvas');
// canvas_layer.width = size_canvas[0];
// canvas_layer.height = size_canvas[1];
// var context_layer = canvas_layer.getContext('2d');
// context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
// context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);
//
// var canvas_layer_tree_shadow = document.createElement('canvas');
// canvas_layer_tree_shadow.width = size_canvas[0];
// canvas_layer_tree_shadow.height = size_canvas[1];
// var context_layer_tree_shadow = canvas_layer_tree_shadow.getContext('2d');
// context_layer_tree_shadow.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
// context_layer_tree_shadow.fillRect(0,0,size_canvas[0], size_canvas[1]);

var max_trees = 100;
for (var i = 0; i < max_trees; i++) {

   var canvas_layer = document.createElement('canvas');
   canvas_layer.width = size_canvas[0];
   canvas_layer.height = size_canvas[1];
   var context_layer = canvas_layer.getContext('2d');
   context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);

   var farthness = 1-(i/max_trees);
   var pos_x = 1600*Math.random();
   var pos_y = 900-180*Math.pow(farthness, 1/2)*2;
   var tree_size = (1-farthness)*60+20;
   draw_tree(pos_x, pos_y, 3.1415, 0, 4, tree_size, sun_dir, context_layer);

   ctx.drawImage(canvas_layer, 0, 0);

   //draw tree shadow on different layer (should it be before the tree?)
   var canvas_layer = document.createElement('canvas');
   canvas_layer.width = size_canvas[0];
   canvas_layer.height = size_canvas[1];
   var context_layer = canvas_layer.getContext('2d');
   context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);

   draw_tree_shadow(pos_x, pos_y, tree_size, sun_dir, context_layer);

   ctx.drawImage(canvas_layer, 0, 0);
}

// ctx.drawImage(canvas_layer, 0, 0);
// ctx.drawImage(canvas_layer_tree_shadow, 0, 0);

//LAKE TODO
{
   var canvas_layer = document.createElement('canvas');
   canvas_layer.width = size_canvas[0];
   canvas_layer.height = size_canvas[1];
   var context_layer = canvas_layer.getContext('2d');
   context_layer.fillStyle = 'rgba(0,0,0,0)'; //maxe context transparent (create a layer)
   context_layer.fillRect(0,0,size_canvas[0], size_canvas[1]);

   var width = 100
   var height = 25
   // draw_lake(810, 800, width, height, context_layer, ctx);

   ctx.drawImage(canvas_layer, 0, 0);
}
