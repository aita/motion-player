gulp = require 'gulp'
watch = require 'gulp-watch'

browserify = require 'browserify'
source = require 'vinyl-source-stream'

gulp.task 'js', ->
  browserify
    entries: ['./src/index.js']
    extensions: ['.coffee', '.js']
    standalone: 'MotionPlayer'
  .bundle()
  .pipe source 'motion-player.js'
  .pipe gulp.dest "./dist/"


gulp.task 'watch', ->
  gulp.watch './src/*.js', ['js']
