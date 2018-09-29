gulp 打包配置文件

目前可执行三种命令

## 功能

1. 实时编译scss文件，生成新的css文件
2. 监听html,shtm等文件，实时刷新预览
3. 监听js文件，实时刷新预览
4. 自动监听图片，替换图片时自动刷新预览
5. 自动合成新的雪碧图， 实时编译scss文件，生成新的css文件


## 安装使用

### 切镜像源
```
# 淘宝源
npm config set registry https://registry.npm.taobao.org

# 中国源
npm config set registry http://registry.cnpmjs.org 

# 官方源
npm config set registry http://registry.npmjs.org 
```

### 安装方法

```
npm install fs path gulp del gulp-replace browser-sync gulp-uglify gulp-csso gulp-sass gulp-util gulp-jshint jshint gulp-plumber gulp-dom gulp-strip-comments gulp-rev gulp-rev-collector gulp.spritesmith gulp-autoprefixer run-sequence gulp-filter gulp-html-minify gulp-imagemin gulp-concat browsersync-iis chokidar
```

### 开发
```
gulp dev
```
实时监听`css`，`js`，`image`，`html`，`shtm`等文件

<b>注意</b>：编译scss会生成一个css目录，开发请操作scss文件，请不要操作css文件

### 打包
```
gulp dist
```
会在根目录生成一个`dist`文件夹

### 清理文件
```
gulp clean
```
清除打包文件`dist`目录和版本标记文件`rev`目录

## 配置

### gulpfile.js配置

```
var paths = {
    dev: {
        dir: './',
        del: ['dist', 'rev'],
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
        del: ['css'],
        css: ['css/*.css', '!css/sprite_*.*'],
        html: ['*.{html,shtm}', 'public/*.{html,htm}'],
        rev: 'rev/rev-manifest.json'
    }
};
```
根据开发需要配置

#### 配置说明
- dev:  开发配置选项
- dist: 打包配置选项



### project.json配置
```
{
    "link": "",
    "rem": false,
    "gate": "",
    "subdir":"",
    "apilink_test": [],
    "apilink": "",
    "task": {
        "checkTitle": true,
        "checkH1": true,
        "checkTongjiJS": true,
        "checkDescKeyword": true,
        "checkCharset": true,
        "checkLang": true,
        "checkTopbar": true
    }
}
```
根据开发需要配置

#### 配置说明

- "link": 图片服路径
- "rem":  是否使用rem处理雪碧图
- "subdir": 组件模板路径
- "apilink_test": 打包需要替换的域名
- "apilink": apilink_test选项替换的域名
- "task": html文件需要检查的事项



## 其他
目前处于开发测试版本，有问题提pr

其他修改包

- [browsersync-iis](https://github.com/teliwa/browsersync-iis)
- [gulp-iis](https://github.com/teliwa/gulp-iis)


