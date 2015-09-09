var postcss = require('postcss');
var path    = require('path');
var url     = require('postcss-url');
var fs      = require('fs');

function cleaner(root) {
    root.walkAtRules('font-face', function (rule) {
        if ( rule.toString().indexOf('Italic') !== -1 ) {
            rule.remove();
        }
    });
    root.walkRules('.full.debug:after', function (rule) {
        rule.remove();
    });
}

function fixCSS(css, file) {
    var plugins = [cleaner, url({ url: 'inline', maxSize: 1000 })];
    return postcss(plugins).process(css, { from: file, to: file });
}

module.exports = function (cssFile, talk) {
    return new Promise(function (resolve, reject) {
        var css, js;
        var npm    = path.join(__dirname, 'node_modules');
        var jsFile = path.join(npm, '/shower-core/shower.min.js');

        function finish() {
            if ( !css || !js ) return;

            var html = '<header class="caption">' + talk.body + '</header>';
            talk.slides.forEach(function (slide, i) {
                var cls = ['slide'].concat(slide.types).join(' ');
                html += '<section class="' + cls + '" id="' + (i + 1) + '">' +
                            '<div>' + slide.body + '</div>' +
                        '</section>';
            });
            html += '<div class="progress"><div></div></div>';

            var meta = '<meta name="viewport" ' +
                            'content="width=680, user-scalable=no">';

            resolve({
                body: ' class="list"',
                head: meta,
                html: html,
                css:  css,
                js:   js
            });
        }

        fs.readFile(jsFile, function (err, data) {
            if ( err ) return reject(err);
            js = data.toString();
            finish();
        });

        fs.readFile(cssFile, function (err, data) {
            if ( err ) return reject(err);
            fixCSS(data, cssFile).then(function (result) {
                css = result.css;
                finish();
            }).catch(function (err2) {
                reject(err2);
            });
        });
    });
};
