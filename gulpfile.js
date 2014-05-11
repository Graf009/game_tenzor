var gulp = require('gulp'),
    csso = require('gulp-csso'),
    rename = require('gulp-rename'),
    htmlmin = require('gulp-htmlmin'),
    uglify = require('gulp-uglify');


gulp.task('css', function() {
    gulp.src('public/app.css')
        .pipe(csso())
        .pipe(rename('app.min.css'))
        .pipe(gulp.dest('public'));
});

gulp.task('js', function() {
    gulp.src('public/app.js')
        .pipe(uglify())
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest('public'));
});

gulp.task('html', function() {
    gulp.src('public/index-dev.html')
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('public'));
});

gulp.task('default', function() {
    gulp.run('build');
});

gulp.task('build', function() {
    gulp.run('html', 'css', 'js');
});
