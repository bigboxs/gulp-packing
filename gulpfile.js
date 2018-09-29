var fs = require('fs'); //nodejs 文件系统
var path = require('path'); //读取路径
var gulp = require('gulp'); //gulp命令
var del = require('del'); //删除文件
var replace = require('gulp-replace'); //替换内容
var browserSync = require('browser-sync').create(); //浏览器实时预览
var uglify = require("gulp-uglify"); //压缩js文件
var csso = require('gulp-csso'); //压缩优化css文件
var sass = require('gulp-sass'); //编译sass
var gutil = require('gulp-util'); //错误警告
var jshint = require("gulp-jshint"); //js校验
var plumber = require('gulp-plumber'); //遇到错误时输出错误,进程不挂掉
var dom = require('gulp-dom');//DOM操作的Gulp插件
var strip = require('gulp-strip-comments'); //删除注释
var rev = require('gulp-rev'); //给文件加hash值版本
var revCollector = require('gulp-rev-collector'); //获取静态资源版本数据
var spritesmith = require('gulp.spritesmith'); //生成雪碧图
var autoprefixer = require('gulp-autoprefixer'); // 自动添加css前缀
var runSequence = require('run-sequence'); //多个任务进行顺序执行或者并行执行 
var filter = require('gulp-filter');//在虚拟文件流中过滤文件
var htmlminify = require('gulp-html-minify');//压缩HTML
var imagemin = require('gulp-imagemin');//压缩图片
var concat = require('gulp-concat');//合并文件
var chokidar = require('chokidar');//监听文件
var browseriis = require('browsersync-iis'); //支持iis

//gulp-posthtml
//posthtml-beautify
//posthtml-minify-classnames
//posthtml-inline-assets
//posthtml-inline-css 

//读取配置文件
var project = JSON.parse(fs.readFileSync('project.json')) || {};

/* 项目配置 */
var paths = {
    dev: {
        dir: './',
        del: ['dist', 'rev'],
        clean: ['css'],
        sprite: 'sprite',
        spriteDir: ['sprite/**/*.{jpg,png}'],
        img:['img/**/*.{jpg,jpeg,png,gif,webp}'],
        imgDir:['img/**/*.{jpg,jpeg,png,gif,webp}','!img/**/sprite*.{png,jpg}'],
        js: ['js/*.js', '!js/{jquery*,*.min,*count,*.class}.js'],
        scss: ['scss/*.scss', '!scss/sprite_*.*'],
        html: ['**/*.{html,shtm,htm}']
    },
    dist: {
        dir: 'dist',
        clean: ['dist'],
        css: ['css/*.css', '!css/sprite_*.*'],
        html: ['*.{html,shtm}', 'public/*.{html,htm}'],
        rev: 'rev/rev-manifest.json'
    }
};
///////////////////////////////////////    END   /////////////////////////////////////////


//获取获取文件名字和路径
var iconFolder = function () {
    var srcDir = path.resolve(process.cwd(), paths.dev.sprite);
    var filesSrc = []; // 文件路径
    var filesName = []; // 文件名字
    // 遍历获取文件名字和路径
    fs.readdirSync(srcDir).forEach(function (file, i) {
        var reg = /\.(png|jpg|gif|ico)/g;
        var isImg = file.match(reg);
        // 判读是  file.indexOf('sprite') != -1
        if (!isImg) {
            filesName.push(file);
            filesSrc.push(path.resolve(srcDir, file, '*.{png,jpg}'));
        }
    });
    // 返回文件名字和路径
    return {
        'name': filesName,
        'src': filesSrc
    };
};
//生成雪碧图（雪碧图放在sprite文件夹下）
gulp.task('sprite', function () {
    var folder = iconFolder();
    var folderName = folder.name;
    var folderSrc = folder.src;
    folderSrc.forEach(function (item, i) {
        var fileNameArr = folderName[i].split("_");
        var fileName = fileNameArr[0];
        //top-down	left-right	diagonal	alt-diagonal	binary-tree
        //top-down 从上到下，适合水平重复
        //left-right 从左到右，适合垂直固定宽度重复
        //diagonal \ 斜线，适合上两者的结合
        //alt-diagonal / 同上
        //binary-tree 默认的值，适合固定宽高的元素集合
        var fileAlgorithm = fileNameArr[1] || 'binary-tree';
        var imgName = 'img/sprite_';
        var cssName = 'scss/sprite_';
        return gulp.src(item) // 需要合并的图片地址
            .pipe(spritesmith({
                imgName: imgName + fileName + '.png', // 保存合并后图片的地址
                cssName: cssName + fileName + '.scss', // 保存合并后对于css样式的地址
                padding: 10, // 合并时两个图片的间距
                algorithm: fileAlgorithm, // 注释1
                cssFormat: 'scss',
                cssTemplate: function (data) {
                    var arr = [];
                    data.sprites.forEach(function (sprite) {
                        if (project.rem) {
                            arr.push("@mixin " + fileName + "_" + sprite.name +
                                "{" +
                                "background-image: url('" + sprite.escaped_image +"');" +
                                "background-size: " + (sprite.total_width) / 100 + "rem " + (sprite.total_height) / 100 + "rem;" +
                                "background-position: " + (sprite.offset_x) / 100 + "rem " + (sprite.offset_y) / 100 + "rem;" +
                                "background-repeat: no-repeat;" +
                                "width:" + (sprite.width) / 100 + "rem;" +
                                "height:" + (sprite.height) / 100 + "rem;" +
                                "}\n");
                        } else {
                            arr.push("@mixin " + fileName + "_" + sprite.name +
                                "{" +
                                "background: url('" + sprite.escaped_image + "') no-repeat " + sprite.px.offset_x + " " + sprite.px.offset_y + ";" +
                                "width:" + sprite.px.width + ";" +
                                "height:" + sprite.px.height + ";" +
                                "}\n");
                        }
                    });
                    return arr.join("");
                }
            }))
            .pipe(gulp.dest(paths.dev.dir));
    });
});
//开发任务
gulp.task('dev-html', function () {
    gulp.src(paths.dev.html, {
            base: './'
        })
        .pipe(plumber())
        .pipe(gulp.dest(paths.dev.dir));
});
//编译sass
gulp.task('dev-scss', ['dev-clean'], function () {
    gulp.src(paths.dev.scss)
        .pipe(plumber())
        //.pipe(sass()).on('error', gutil.log)
        .pipe(sass()).on('error', function (err) {
            console.error('Error!', err.message);
        })
        .pipe(autoprefixer([
            'last 6 version',
            'ie >= 6',
            'ie_mob >= 10',
            'ff >= 30',
            'chrome >= 34',
            'safari >= 7',
            'opera >= 23',
            'ios >= 7',
            'android >= 4.0',
            'bb >= 10'
        ]))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.stream());
});
//校验js
gulp.task('dev-js',  function () {
    gulp.src(paths.dev.js, {
            base: './'
        })
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter());
});
//刷新
gulp.task('reload', function () {
    browserSync.reload();
});
//浏览器预览
gulp.task('dev-browser', ['dev-scss'],function () {
    var basedir = paths.dev.dir;
    if (project.gate) {
        var arr_dir = path.dirname(__filename).split(path.sep);
        //如果最后一层目录不是project.gate，则删去project.gate之后的目录
        if (arr_dir[arr_dir.length - 1] != project.gate) {
            basedir = arr_dir.slice(0, arr_dir.indexOf(project.gate) + 1).join(path.sep);
        }
    }
    browserSync.init({
        server: {
            baseDir: basedir,
            middleware: browseriis({
                baseDir: basedir,
                ext: '.shtm'
            })
        }
    });
});
//监听文件
//https://github.com/paulmillr/chokidar
gulp.task('dev-watch', ['dev-browser'], function () {
    chokidar.watch(paths.dev.html).on('change', function(){
        runSequence('reload');
    });
    chokidar.watch(paths.dev.scss).on('change', function(){
        runSequence('dev-scss');
    });
    chokidar.watch(paths.dev.js).on('change', function(){
        runSequence('dev-js','reload');
    });
    chokidar.watch(paths.dev.imgDir,{
        ignoreInitial: true
    }).on('change', function(){
        runSequence('reload');
    });

    //监听雪碧图文件夹
    chokidar.watch(paths.dev.spriteDir,{
        ignoreInitial: true
    }).on('add', function(path, event){
        runSequence('sprite',['dev-scss']);
    }).on('change', function(path, event){
        runSequence('sprite',['dev-scss']);
    }).on('unlink', function(path, event){
        runSequence('sprite',['dev-scss']);
    }).on('error', function(error, event){
        console.log('Watcher error: ${error}');
    });  
    
});
//清理编译文件
gulp.task('dev-clean', function (cb) {
    return del(paths.dev.clean, cb);
});
//编译开发模式（区分先后顺序）
gulp.task('dev',['dev-js','dev-watch']);
///////////////////////////////////////    END   /////////////////////////////////////////


//发布任务
gulp.task('dist-html', ['dist-js'],function () {
    var revArr = paths.dist.html;
    revArr.unshift(paths.dist.rev);
    var subdir = project.subdir ? project.subdir + "/" : "";
    gulp.src(revArr, {
            base: './'
        })
        .pipe(plumber())
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(replace(new RegExp("(\'|\")(\/m\/|\/|\.\/|\.\.\/|)" + subdir + "(css|js|img|music|audio)(\/)", 'g'), '$1' + project.link + '$3/'))
        .pipe(replace(new RegExp(project.apilink_test.join('|'), 'g'), project.apilink))
        .pipe(strip.html({
            ignore: /<!--#include[^>]*>/g
        }))
        .pipe(gulp.dest(paths.dist.dir))
        .pipe(dom(function () {
            var t = this;
            if (project.task.checkTitle) {
                var title = t.querySelectorAll('title')[0];
                if (title) {
                    if (title.innerHTML.indexOf("多益网络") === -1) {
                        gutil.log(gutil.colors.red("标题必须包含“多益网络”： ") + title.innerHTML);
                    }
                } else {
                    gutil.log(gutil.colors.red("连个标题都没有！~~~~(>_<)~~~~ "));
                }
            }
            if (project.task.checkH1) {
                var h1 = t.querySelectorAll('h1')[0];
                if (!h1 || h1.innerHTML.length < 3) {
                    gutil.log(gutil.colors.red("必须包含h1标签！"));
                }
            }
            if (project.task.checkDescKeyword) {
                var desc = t.querySelectorAll('meta[name="description"]')[0];
                var kwd = t.querySelectorAll('meta[name="keywords"]')[0];
                if (!desc) {
                    gutil.log(gutil.colors.red("必须包含描述标签！"));
                }
                if (!kwd) {
                    gutil.log(gutil.colors.red("缺少关键字标签！"));
                } else {
                    var kwd_con = kwd.getAttribute("content");
                    if (kwd_con.indexOf("，") !== -1) {
                        gutil.log(gutil.colors.red("关键字标签包含了中文逗号！"));
                    }
                }
            }
            if (project.task.checkCharset) {
                var charset = t.querySelectorAll('[charset]')[0];
                if (charset) {
                    if (charset.getAttribute("charset").toUpperCase() !== "UTF-8") {
                        gutil.log(gutil.colors.red("charset需要声明为 utf-8！"));
                    }
                } else {
                    gutil.log(gutil.colors.red("缺少charset声明标签！"));
                }
            }
            if (project.task.checkLang) {
                var lang = t.querySelectorAll('head')[0].getAttribute("lang");
                if (lang && lang.toUpperCase() === "CH") {
                    gutil.log(gutil.colors.red("ch为不合法值，请考虑将lang声明为 zh-CN 或者去掉lang属性！"));
                }
            }
            var scripts = t.querySelectorAll('script');
            var hastongjiJS = false;
            var hasTopbarJS = false;
            var gameTongjiIsRight = false;
            scripts = Array.prototype.slice.call(scripts);
            scripts.forEach(function (val, inx) {
                var src = val.getAttribute("src");
                if (!src) {
                    src = val.innerHTML;
                }
                if (src.indexOf("_count.js") !== -1) {
                    hastongjiJS = true;
                    // 判断引入的统计代码中的游戏名称 和 配置中的link 里面的游戏目录是否对应上。
                    var reg = /\/(\w+)_count/i;
                    var chk = src.match(reg);
                    var game = chk ? chk[1] : '';
                    if (project.link.indexOf(game) !== -1) {
                        gameTongjiIsRight = true;
                    }
                }
                if (src.indexOf("topbar.last.js") !== -1) {
                    hasTopbarJS = true;
                }
                //gutil.log(val.getAttribute("src"));
            });
            if (project.task.checkTongjiJS && !hastongjiJS) {
                gutil.log(gutil.colors.red("请引入官网统计文件！"));
            }
            if (project.task.checkTongjiJS && !gameTongjiIsRight) {
                gutil.log(gutil.colors.red("引入的统计代码不正确！"));
            }
            if (project.task.checkTopbar && !hasTopbarJS) {
                gutil.log(gutil.colors.red("请引入公共顶部导航文件！ //image.duoyi.com/js/topbar/topbar.last.js"));
            }
            return this;
        }));
});
//打包css
gulp.task('dist-css',['dist-img'], function () {
    var revArr = paths.dist.css;
    revArr.unshift(paths.dist.rev);
    return gulp.src(revArr, {
            base: './'
        })
        .pipe(plumber())
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(csso())
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.dir))
        .pipe(rev.manifest(paths.dist.rev, {
            base: paths.dist.rev,
            merge: true
        }))
        .pipe(gulp.dest(paths.dist.rev));
});
//打包js
gulp.task('dist-js', ['dist-css'],function () {
    var revArr = paths.dev.js;
    revArr.unshift(paths.dist.rev);
    return gulp.src(revArr, {
            base: './'
        })
        .pipe(plumber())
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(replace(new RegExp(project.apilink_test.join('|'), 'g'), project.apilink))
        .pipe(uglify()).on('error', gutil.log)
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.dir))
        .pipe(rev.manifest(paths.dist.rev, {
            base: paths.dist.rev,
            merge: true
        }))
        .pipe(gulp.dest(paths.dist.rev));
});
//打包img
gulp.task('dist-img', ['dist-clean'], function () {
    return gulp.src(paths.dev.img, {
            base: './'
        })
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.dir))
        .pipe(rev.manifest(paths.dist.rev, {
            base: paths.dist.rev,
            merge: true
        }))
        .pipe(gulp.dest(paths.dist.rev));
});
//清理打包文件
gulp.task('dist-clean', function (cb) {
    return del(paths.dist.clean, cb);
});
//打包发布（区分先后顺序）
gulp.task('dist', ['dist-html']);
///////////////////////////////////////    END   /////////////////////////////////////////



//删除所有打包编译的文件
gulp.task('clean',  function (cb) {
    return del(paths.dev.del, cb);
});
///////////////////////////////////////    END   /////////////////////////////////////////


// 默认任务
gulp.task('default', ['dist']);

