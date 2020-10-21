/* eslint-disable no-console */
/* jshint node: true */
'use strict';

/**
 * Usage général :
 *
 *  - tâche "gulp" : fichiers compilés dans "/dist" (ni minifiés ni concaténés).
 *    Le client peut modifier, améliorer et mettre en prod lui-même.
 *
 *  - tâche "gulp --prod" : fichiers compilés dans "/dist" (minifiés, concaténés,
 *    optimisés, etc.). Le client utilise tel quel.
 */


/**
 * Chargement et initialisation des composants utilisés (browserSync et documentation ne sont chargés ci-après que hors env. de production donc en l'absence de l'argument --prod)
 */
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    argv = require('yargs').argv,
    del = require('del');

/**
 * Tâche (et packages) de production si ajout de l'argument "--prod" (seulement à la fin ?)
 */
var isProduction = argv.prod;
if (isProduction) {
    console.log('VOUS ÊTES EN ENVIRONNEMENT DE PRODUCTION !');
}

/**
 * Configuration générale du projet et des composants utilisés
 */
var project = {
    plugins: { // activation ou désactivation de certains plugins à la carte
        babel: false // utilisation de Babel pour transpiler JavaScript
    },
    configuration: { // configuration des différents composants de ce projet
        cssbeautify: {
            indent: '  ',
        },
        htmlExtend: {
            annotations: false,
            verbose: false,
        },
        sass: {
            outputStyle: 'expanded' // CSS non minifiée plus lisible ('}' à la ligne)
        }
    },
};


/**
 * Chemins vers les ressources ciblées
 */
var paths = {
    root: './', // dossier actuel
    src: './src/', // dossier de travail
    dest: './dist/', // dossier destiné à la livraison
    vendors: './node_modules/', // dossier des dépendances du projet
    assets: 'assets/',
    styles: {
        root: 'assets/css/', // fichier contenant les fichiers CSS & Sass
        css: {
            mainFile: 'assets/css/styles.css', // fichier CSS principal
            files: 'assets/css/*.css', // cible tous les fichiers CSS
        },
        sass: {
            mainFile: 'assets/sass/styles.scss', // fichier Sass principal
            styleguideFile: 'assets/guide/guide.scss', // fichier Sass spécifique au Styleguide
            files: 'assets/sass/{,*/}*.scss', // fichiers Sass à surveiller (css/ et tous ses sous-répertoires)
        },
    },
    scripts: {
        root: 'assets/js/', // dossier contenant les fichiers JavaScript
        files: 'assets/js/{,*/}*.js', // fichiers JavaScript
        mainFile: 'global.min.js', // nom du fichier JS après concaténation
    },
    html: {
        racine: '*.html', // fichiers & dossiers HTML à compiler / copier à la racine uniquement
        allFiles: '{,includes/}*.html', // fichiers & dossiers HTML à compiler / copier à la racine et dans le dossier includes/
    },
    fonts: 'assets/css/fonts/', // fichiers typographiques à copier,
    misc: '*.{ico,htaccess,txt}', // fichiers divers à copier
};

/**
 * Ressources JavaScript utilisées par ce projet (vendors + scripts JS spécifiques)
 */
var jsFiles = [
    paths.src + paths.scripts.files,
];
// Copie du vendor jQuery (hors des scripts du projet et du styleguide). Ne sera pas concaténé même en env. de prod
var jqueryFile = [
    paths.vendors + 'jquery/dist/jquery.min.js',
];

/**
 * Tâche de gestion des erreurs à la volée
 */
var onError = {
    errorHandler: function (err) {
        console.log(err);
        this.emit('end');
    }
};


/* ------------------------------------------------
 * Tâches de Build : css, html, js, fonts
 * ------------------------------------------------
 */

// Tâche CSS : Sass + Autoprefixer + minify (si prod)
// Pour LA CSS du projet
gulp.task('css:main', () => {
    return gulp.src(paths.src + paths.styles.sass.mainFile)
        .pipe($.plumber(onError))
        .pipe($.sass(project.configuration.sass))
        .pipe($.autoprefixer())
        // En dév, on évite d'écrire 2 fois le même fichier (ni renommage ni CSSO en dév et pourtant on écrit du CSS à 2 reprises… identique avec le même nom)
        // En env. de prod, on écrit une CSS non-minifiée puis avec le suffixe .min.css une CSS minifiée
        .pipe($.if(!isProduction, gulp.dest(paths.dest + paths.styles.root)))
        .pipe($.if(isProduction, $.rename({suffix: '.min'})))
        .pipe($.if(isProduction, $.csso()))
        // En env de prod, pas de sourcemaps. En dév, les sourcemaps concernent la CSS non minifiée
        .pipe(gulp.dest(paths.dest + paths.styles.root));
});
gulp.task('css:guide', () => {
    return gulp.src(paths.src + paths.styles.sass.styleguideFile)
        .pipe($.plumber(onError))
        .pipe($.sass(project.configuration.sass))
        .pipe($.autoprefixer())
        .pipe(gulp.dest(paths.dest + paths.styles.root));
});
gulp.task('css', gulp.series('css:main', 'css:guide'));


// Tâche HTML : includes HTML
gulp.task('html', () => {
    return gulp.src(paths.src + paths.html.allFiles)
        .pipe($.plumber(onError))
        .pipe($.htmlExtend(project.configuration.htmlExtend))
        .pipe(gulp.dest(paths.dest));
});

// Tâches JS : copie des fichiers JS et vendor + babel (+ concat et uglify dans global.min.js si prod)
//             pour le projet puis ce qui est spécifique au Styleguide (évite d'inclure
//             ces derniers dans global.min.js)
//             puis le vendor jQuery
gulp.task('js:main', () => {
    return gulp.src(jsFiles)
        .pipe($.plumber(onError))
        .pipe($.if(project.plugins.babel,$.babel({presets:['env']})))
        .pipe(gulp.dest(paths.dest + paths.scripts.root))
        .pipe($.concat(paths.scripts.mainFile))
        .pipe($.if(isProduction, $.uglify()))
        .pipe(gulp.dest(paths.dest + paths.scripts.root));
});
// Copie du vendor jQuery 3.x
gulp.task('js:jquery', () => {
    return gulp.src(jqueryFile)
        .pipe($.plumber(onError))
        .pipe(gulp.dest(paths.dest + paths.scripts.root));
});
gulp.task('js', gulp.series('js:main', 'js:jquery'));

// Tâche CLEAN : supprime les fichiers CSS et JavaScript inutiles en production
gulp.task('clean', () => {
    return del([
        paths.dest + paths.scripts.files, // on supprime tous les fichiers JS de production
        paths.dest + paths.scripts.root + '{,*/*}',
        '!' + paths.dest + paths.scripts.root + paths.scripts.mainFile, // sauf les JS concaténés finaux
        paths.dest + paths.styles.css.files, // on supprime tous les fichiers CSS de production
        '!' + paths.dest + paths.styles.root + 'styles.min.css', // sauf les CSS concaténés finaux
    ]);
});

/* ----------------------------------
 * Tâches principales : récapitulatif
 * ----------------------------------
 */

// Tâche BUILD : tapez "gulp" ou "gulp build"
gulp.task('build', gulp.series('css', 'js', 'html'));

// Tâche PROD : tapez "gulp build --prod"

// Tâche WATCH : surveillance Sass, HTML et PHP
gulp.task('watch', () => {
    // Watch des _partials Scss, du code HTML, du JS et des includes du styleguide
    gulp.watch([paths.styles.sass.files], {cwd: paths.src}, gulp.series('css'));
    gulp.watch([paths.html.allFiles], {cwd: paths.src}, gulp.series('html'));
    gulp.watch([paths.scripts.files], {cwd: paths.src}, gulp.series('js'));
});

// Tâche par défaut
gulp.task('default', gulp.series('build'));