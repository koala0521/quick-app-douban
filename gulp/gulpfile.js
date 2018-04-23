var gulp = require('gulp'),
    rename = require('gulp-rename'),
    del = require('del'),  
    // babel = require('gulp-babel'),
    uglify = require('gulp-uglify');

var pump = require('pump');

gulp.task('default', function() {
  // 将你的默认的任务代码放在这
    gulp.src('../src/appStatistics.js')
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('delete',function(cb){  
    return del(['dist/*'],cb);  
}) 

gulp.task('ug',function(cb){  
    pump([
        gulp.src('../src/appStatistics.js'),
        uglify(),
        gulp.dest('./dist/js')
    ],
    cb
    );
    
}) 
