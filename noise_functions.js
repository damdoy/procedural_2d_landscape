var array = [];

function random_noise(array, size_x, size_y, size_sub) {
   for (var i = 0; i < array.length; i++) {
      for (var j = 0; j < array[i].length; j++) {
         array[i][j] = Math.random();
      }
   }
}

function bilin_mix(x, y, a)
{
   return (1-a)*x+a*y;
}

function cubic_mix(x, y, a) //-3x^3+2x^2
{
   var ia = (1.0-a);
   var ret =  (-2.0*ia*ia*ia+3.0*ia*ia)*x+(-2.0*a*a*a+3.0*a*a)*y;
   return ret;
}

//other form of cubic mix
function ease_mix(x, y, a) //6x^5-15x^4+10x^3
{
   var ia = (1.0-a);
   var ret =  (6.0*Math.pow(ia,5)-15.0*Math.pow(ia, 4)+10.0*Math.pow(ia,3))*x+(6.0*Math.pow(a,5)-15.0*Math.pow(a, 4)+10.0*Math.pow(a,3))*y;
   return ret;
}

//will interpolate pixels between values of a coarse matrix
function interp_noise(size_x, size_y, size_sub, mix_function) {
   var coarse_array = [];
   var ret_array = [];
   if(size_sub == 0) //avoid div by 0
   {
      size_sub = 1;
   }
   //dimentions for the coarse lattice containing points
   var sub_size_x = Math.floor(size_x/size_sub);
   var sub_size_y = Math.floor(size_y/size_sub);

   for (var i = 0; i < sub_size_x+2; i++) {
      coarse_array[i] = [];
      for (var j = 0; j < sub_size_y+2; j++) {
         coarse_array[i][j] = Math.random();
      }
   }

   for (var i = 0; i < size_x; i++) {
         ret_array[i] = [];
      for (var j = 0; j < size_y; j++) {
         var lattice_x = Math.floor(i/size_sub);
         var lattice_y = Math.floor(j/size_sub);
         var x_ratio = (i%size_sub)/size_sub;
         var y_ratio = (j%size_sub)/size_sub;
         var top_val = mix_function(coarse_array[lattice_x][lattice_y], coarse_array[lattice_x+1][lattice_y], x_ratio);
         var bottom_val = mix_function(coarse_array[lattice_x][lattice_y+1], coarse_array[lattice_x+1][lattice_y+1], x_ratio);
         ret_array[i][j] = mix_function(top_val, bottom_val, y_ratio);
      }
   }
   return ret_array;
}

function dot(x, y)
{
   return x[0]*y[0]+x[1]*y[1];
}

function perlin_noise(size_x, size_y, size_sub) {
   var gradients_lattice = [];
   var sub_size_x = Math.floor(size_x/size_sub);
   var sub_size_y = Math.floor(size_y/size_sub);

   for (var i = 0; i < sub_size_x+2; i++) {
      gradients_lattice[i] = [];
      for (var j = 0; j < sub_size_y+2; j++) {
         var gradient_vec = [Math.random()*2-1.0, Math.random()*2-1.0];
         var grad_vec_size = Math.sqrt(gradient_vec[0]*gradient_vec[0]+gradient_vec[1]*gradient_vec[1]);
         gradients_lattice[i][j] = [gradient_vec[0]/grad_vec_size, gradient_vec[1]/grad_vec_size]; //normalize
      }
   }

   return gradient_noise(size_x, size_y, size_sub, gradients_lattice);
}

function improved_perlin_noise(size_x, size_y, size_sub) {
   var gradients_lattice = [];
   var sub_size_x = Math.floor(size_x/size_sub);
   var sub_size_y = Math.floor(size_y/size_sub);

   for (var i = 0; i < sub_size_x+2; i++) {
      gradients_lattice[i] = [];
      for (var j = 0; j < sub_size_y+2; j++) {
         var gradient_vec = [0, 0];
         var rand_var = Math.floor(Math.random()*3.9999);
         switch(rand_var) {
            case 0: gradient_vec = [1, 0];
               break;
            case 1: gradient_vec = [0, 1];
               break;
            case 2: gradient_vec = [-1, 0];
               break;
            case 3: gradient_vec = [0, -1];
               break;
         }
         gradients_lattice[i][j] = gradient_vec; //normalize
      }
   }

   return gradient_noise(size_x, size_y, size_sub, gradients_lattice);
}

function improved_perlin_noise_recurs(size_x, size_y, size_sub, nb_recursions) {

   var array_ret = [];

   for (var i = 0; i < nb_recursions; i++) {
         array_ret[i] = improved_perlin_noise(size_x, size_y, Math.ceil(size_sub/(i+1)));
   }

   // var value = 0;
   // for (var i = 0; i < params.nb_recursions; i++) {
   //    value += 1/(i+1)*(array[i][x][y]*2-1);
   // }
   // value = value*0.5+0.5;

   for (var x = 0; x < array_ret[0].length; x++) {
      for (var y = 0; y < array_ret[0][x].length; y++) {
         for (var i = 1; i < nb_recursions; i++) {
            array_ret[0][x][y] += 1/(i+1)*(array_ret[i][x][y]*2-1);
         }
         array_ret[0][x][y] = array_ret[0][x][y];
      }
   }

   return array_ret[0];
}

function gradient_noise(size_x, size_y, size_sub, gradients_lattice) {
   var array = [];

   for (var i = 0; i < size_x; i++) {
      array[i] = []
      for (var j = 0; j < size_y; j++) {
         var lattice_x = Math.floor(i/size_sub);
         var lattice_y = Math.floor(j/size_sub);
         var x_ratio = (i%size_sub)/size_sub;
         var y_ratio = (j%size_sub)/size_sub;
         var top_left = dot([x_ratio, y_ratio], gradients_lattice[lattice_x][lattice_y]);
         var top_right = dot([-(1-x_ratio), y_ratio], gradients_lattice[lattice_x+1][lattice_y]);
         var bot_left = dot([x_ratio, -(1-y_ratio)], gradients_lattice[lattice_x][lattice_y+1]);
         var bot_right = dot([-(1-x_ratio), -(1-y_ratio)], gradients_lattice[lattice_x+1][lattice_y+1]);
         var top = cubic_mix(top_left, top_right, x_ratio);
         var bot = cubic_mix(bot_left, bot_right, x_ratio);
         array[i][j] = cubic_mix(top, bot, y_ratio)*0.5+0.5; //must be in [0, 1]
      }
   }
   return array;
}
