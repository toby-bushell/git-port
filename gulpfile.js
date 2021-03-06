var gulp         = require('gulp');
var sass         = require('gulp-sass');
var sourcemaps   = require('gulp-sourcemaps');
var spritesmith  = require('gulp.spritesmith');
var imagemin     = require('gulp-imagemin');
var plumber      = require('gulp-plumber');
var notify       = require('gulp-notify');
var jshint       = require('gulp-jshint'); // Notify on JS errors
var uglify       = require('gulp-uglify');
var minifyCSS    = require('gulp-minify-css');
var gutil        = require('gulp-util'); // used to check the param passed from command line
var gulpif       = require('gulp-if'); // Conditionally run a task
var stripDebug   = require('gulp-strip-debug'); // Strip out console.log messages etc
var concat       = require('gulp-concat'); // combines the JS int one file
var filter       = require('gulp-filter'); // ensures that only *.css files ever reach .reload - this way we'll still get CSS injecting.
var browserSync  = require('browser-sync').create();
var autoprefixer = require('gulp-autoprefixer');
var sizereport   = require('gulp-sizereport');

// Set some defaults
var isDev  = true;
var isProd = false;

// If "prod" is passed from the command line then update the defaults
if(gutil.env._[0] === 'prod') {
  isDev  = false;
  isProd = true;
}

var plumberErrorHandler = { errorHandler: notify.onError({
    title: 'Gulp',
    message: 'Error: <%= error.message %>'
  })
};


// Gulp Sass Task
gulp.task('sass', function() {
  return gulp.src('./sass/{,*/}*.{scss,sass}')
    .pipe(plumber(plumberErrorHandler))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
        browsers: ["> 1%", "last 2 versions", "Firefox ESR"]
      }))
    .pipe(gulpif(isProd, minifyCSS()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./css'))
    .pipe(filter('**/*.css')) // Filtering stream to only css files
    .pipe(browserSync.reload({stream:true}));
})


gulp.task('sizereport', function () {
   return gulp.src('./css/*.css')
     .pipe(sizereport({
        gzip: true
      }));
});


gulp.task('sprite', function () {
  var spriteData = gulp.src('./images/sprites/*.png').pipe(spritesmith({
    retinaSrcFilter: ['./images/sprites/*@2x.png'],
    imgName: 'sprite.png',
    retinaImgName: 'sprite@2x.png',
    cssName: '_sprites.scss',
    imgPath: '../images/sprite.png',
    retinaImgPath: '../images/sprite@2x.png'
  }));

  // Pipe image stream through image optimizer and onto disk
  spriteData.img
    .pipe(imagemin())
    .pipe(gulp.dest('./images/'));

  spriteData.css.pipe(gulp.dest('./sass/components/'));
});


gulp.task('jshint', function() {
  return gulp.src('./js/src/*.js')
    .pipe(plumber(plumberErrorHandler))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(filter('**/*.js')) // Filtering stream to only js files
    .pipe(browserSync.reload({stream:true}));
});


gulp.task('scripts', function() {
  return gulp.src('./js/src/*.js')
    .pipe(plumber(plumberErrorHandler))
    .pipe(concat('script.min.js'))
    // .pipe(stripDebug())
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest('./js/'))
    .pipe(notify({ message: 'Scripts task complete: combined, debug stripped, uglified' }));
});


gulp.task('browser-sync', function() {
   browserSync.init(null, {
    /*
      If you comment out the next line BrowserSync will provide the JS code that needs to be
      inserted into the HTML/Template for it to still work on your normal server & URL.
    */
      proxy: "http://localhost/wp/"
  });
});


gulp.task('bs', ['sass', 'browser-sync', 'jshint', 'sizereport', 'scripts'], function () {
   //do stuff after 'sass', 'sprite', 'browser-sync' etc are done.
  gulp.watch('./sass/**/*.{scss,sass}', ['sass'])
  gulp.watch('./js/src/**/*.js', ['jshint','scripts']);
  gulp.watch('./css/*.css', [ 'sizereport'] );
});


gulp.task('default', ['sass', 'jshint', 'sizereport'], function () {
   //do stuff after 'sass', 'jshint' etc are done.
  gulp.watch('./sass/**/*.{sass,scss}', ['sass'])
  gulp.watch('./js/src/**/*.js', ['jshint']);
  gulp.watch('./css/*.css', [ 'sizereport'] );
});


gulp.task('prod', ['sass', 'sprite', 'jshint', 'scripts'], function () {

});
