'use strict';

module.exports = {

  db_host: "ec2-54-157-250-150.compute-1.amazonaws.com",
  db_user: "joe",
  db_pass: "password",
  db_name: "nasa_pds",
  db_table_name: "map_image",

  offset: 0,
  limit: 10,
  image_path_in: "./images_in/",
  image_path_out: "./images_out/",
  image_path_tmp: "./images_tmp/",

  run_sh_path: "./run.sh",
  mock_script_path: "./run_dummy.sh",
  moon_map_path: "./moon.map",

  user_id: '55c1f9a8330bdb8018ebf557',
  board_id: '55c1f9af330bdb8018ebf578',
  placeholder_image: 'placeholder.jpg',
  image_width: 300,

  run_mock_script: true
};