/**
 * Created by Marian on 09/12/2015.
 */

var paths = {
    tmp: './tmp',
    src: './app',
    pub: './public'
};

var gulp         = require('gulp');
var jade         = require('gulp-jade');
var data         = require('gulp-data');
var debug        = require('gulp-debug');
var browserSync  = require('browser-sync');
var sass         = require('gulp-sass');
var rev          = require('gulp-rev');
var clean        = require('gulp-clean');
var inject       = require('gulp-inject');
var sourcemaps   = require('gulp-sourcemaps');
var plumber      = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var htmlMin      = require('gulp-html-minifier');
var sassdoc      = require('sassdoc');


var autoprefixerOptions = {
    browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

var sassOptions = {
    dev : {
        errLogToConsole: true,
        outputStyle    : 'expanded'
    },
    prod: {
        outputStyle: 'compressed'
    }
};

function browserSyncInit(baseDir, files) {
    browserSync.instances = browserSync.init(files, {
        startPath: '/',
        server   : { baseDir }
    });
}

gulp.task('clean:tmp', function () {
    return gulp
        .src([
            paths.tmp + '/**/*.css',
            paths.tmp + '/**/*.html'
        ])
        .pipe(clean());
});

gulp.task('assets:dev', function () {
    gulp.src(paths.src + '/assets/fonts/**/*')
        .pipe(gulp.dest(paths.tmp + '/fonts'));
});

gulp.task('assets:build', function () {
    gulp.src(paths.src + '/assets/fonts/**/*')
        .pipe(gulp.dest(paths.pub + '/fonts'));
});

gulp.task('index', ['clean:tmp', 'assets:dev', 'sass:dev'], function () {
    // return gulp.src(paths.src + '/index.html')
    return gulp.src(paths.src + '/*.jade')
        .pipe(data((file) => require('./app/data/cv.json')))
        .pipe(jade({ pretty: true }))
        .pipe(inject(
            gulp.src(paths.tmp + '/stylesheets/**/*.css', {
                read: false
            }).pipe(debug()),
            {
                relative    : false,
                addRootSlash: true
            }
        ))
        .pipe(gulp.dest(paths.tmp));
});

gulp.task('serve', ['index'], function () {
    // Initialize browser sync server
    browserSyncInit([
        paths.tmp
    ]);

    // Watch for sass
    gulp.watch([paths.src + '/**/*.scss', paths.src + '/**/_*.scss'], ['sass:dev']);
    //
    // // Watch for HTML
    // gulp.watch(paths.src + '/**/*.html', ['index']);
    gulp.watch(paths.src + '/**/*.jade', ['index']).on('change', function(event) {
        console.log('File src' + event.path + ' was ' + event.type + ', running tasks...');
        browserSync.reload;
    });
    gulp.watch(paths.tmp + '/index.html').on('change', function(event) {
        console.log('File tmp' + event.path + ' was ' + event.type + ', running tasks...');
        browserSync.reload;
    });
});

gulp.task('sass:dev', function () {
    return gulp
    // Find all `.scss` files from the `stylesheets/` folder
        .src(paths.src + '/stylesheets/**/*.scss')
        .pipe(plumber())
        // Run Sass on those files
        .pipe(sass(sassOptions.dev).on('error', sass.logError))
        .pipe(sourcemaps.write(paths.tmp + '/stylesheets/maps'))
        // Write the resulting CSS in the output folder
        .pipe(gulp.dest(paths.tmp + '/stylesheets'))
        .pipe(browserSync.stream())
});

gulp.task('sass:prod', function () {
    return gulp
    // Find all `.scss` files from the `stylesheets/` folder
        .src(paths.src + '/stylesheets/**/*.scss')
        .pipe(plumber())
        // Run Sass on those files
        .pipe(sass(sassOptions.prod).on('error', sass.logError))
        .pipe(sourcemaps.write(paths.pub + '/stylesheets/maps'))
        .pipe(autoprefixer(autoprefixerOptions))
        // Write the resulting CSS in the output folder
        .pipe(gulp.dest(paths.pub + '/stylesheets'));
});

gulp.task('minify', ['assets:build', 'sass:prod'], function () {
    // gulp.src(paths.src + '/**/*.html')
    gulp.src(paths.src + '/**/*.jade')
        .pipe(data((file) => require('./app/data/cv.json')))
        .pipe(jade())
        .pipe(inject(
            gulp.src(paths.pub + '/**/*.css', {
                read: false
            }),
            {
                relative    : false,
                addRootSlash: true,
                transform   : function (filepath, file, i, length) {
                    var regexp = new RegExp(paths.pub.slice(1))
                    filepath   = filepath.replace(regexp, '');
                    return `<link rel="stylesheet" href="${filepath}">`;
                }
            }
        ))
        .pipe(htmlMin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(paths.pub))
});

gulp.task('prod', ['minify'], function () {
});

gulp.task('default', ['serve']);
