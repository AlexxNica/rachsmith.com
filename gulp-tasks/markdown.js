var fs = require('fs');
var jsdom = require('jsdom');
var markdown = require('gulp-markdown');

module.exports = function(gulp) {
    return {
        process: function(filename, contentType, callback) {
            var post = {
                md: filename,
                html: filename.replace('md', 'html'),
                settings: {}
            }
            fs.readFile('site/content/' + contentType + '/' + post.md, 'utf8', function(err, data) {
                var lines = data.split('\n');
                var postContent = '';
                for (var i = 0, l = lines.length; i < l; i++) {
                    var setting = lines[i].match('(.*)\::');
                    if (setting) {
                        post.settings[setting[1]] = lines[i].split(setting[0] + ' ')[1];
                        if (setting[1] == 'date') post.settings.formattedDate = formatDate(post.settings.date);
                    } else postContent += lines[i] + '\n';
                }

                post.path = post.settings.type == 'post' || post.settings.type == 'micro-post' ? post.settings.date.split('-')[0] : '';

                fs.writeFile('processing/' + post.md, postContent, 'utf8', function() {
                    gulp.src('processing/' + post.md)
                        .pipe(markdown())
                        .pipe(gulp.dest('processing'))
                        .on('end', function() {
                            fs.readFile('processing/' + post.html, 'utf8', function(err, content) {
                                post.settings.content = content;
                                if (content) jsdom.env(content, function(errors, window) {
                                    post.settings.extract = window.document.getElementsByTagName('p')[0].innerHTML;
                                    post.settings.url = post.path + '/' + post.html;
                                    if (post.settings.type == 'micro-post') {
                                        var heading = window.document.getElementsByTagName('h1')[0].outerHTML;
                                        post.settings.homepageContent = content.replace(/<h1[\s\S]*<\/h1>/, '');
                                    }
                                    window.close();
                                    callback(post);
                                    //fs.unlink(post.md);
                                    //fs.unlink(post.html);
                                });

                            });
                        });
                });
            });
        }
    }
};

function formatDate(date) {
    var dateSplit = date.split('-');
    var d = new Date(dateSplit[0], dateSplit[1], dateSplit[2])
    return formatDateToText(d);
}

function addOrd(n) {
    var ords = [, 'st', 'nd', 'rd'];
    var ord, m = n % 100;
    return n + ((m > 10 && m < 14) ? 'th' : ords[m % 10] || 'th');
}

// Return date string two weeks from now (14 days) in
// format 13th March 2013
function formatDateToText(d) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Copy date object so don't modify original
    var e = new Date(d);

    // Add two weeks (14 days)
    return addOrd(e.getDate()) + ' ' + months[e.getMonth()] + ' ' + e.getFullYear();
}