const gulp = require('gulp');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const rollup = require('gulp-better-rollup');

gulp.task('scripts', () => gulp
  .src('src/index.js')
  .pipe(rollup({
    plugins: [babel()]
  }, 'iife'))
  .pipe(concat('mock-tools.js', {
    newLine: ';'
  }))
  .pipe(gulp.dest('./dist/')));
