const gulp = require('gulp');
const concat = require('gulp-concat');

gulp.task('scripts', () => gulp.src([
    './node_modules/jquery-mockjax/dist/jquery.mockjax.js',
    './src/ajax-mock.js',
    './src/socket-mock.js',
  ])
  .pipe(concat('mock-tools.js', {
    newLine: ';'
  }))
  .pipe(gulp.dest('./dist/')));