"use strict";
var ytdl = require("ytdl-core");
var program = require("commander");
var fs = require("fs");
var ProgressBar = require("progress");
var Promise = require("bluebird");
require('console.table');
/*
 * Takumi Adachi
 * 02/01/2017
 *
 * MIT License
 *
 * Node application to quickly and conveniently download adequate quality music, podcasts or audio from Youtube.
 *
 * Has options for batch and checking bitrate of youtube audio.
 */
// Run main routine,
main();
// Main routine.
function main() {
    program
        .version('0.2.0')
        .description("audl - A convenient node command-line app to download youtube audio content such as podcasts and music.\n\n            Examples:\n\n            audl -d https://www.youtube.com/watch?v=9bZkp7q19f0\n            audl -i https://www.youtube.com/watch?v=9bZkp7q19f0\n            audl -b batch.txt\n            audl -bi batch.txt\n            audl -q https://www.youtube.com/watch?v=9bZkp7q19f0 -q 141")
        .option('-d, --url [url]', 'Specify youtube link to download.')
        .option('-b, --batch [file]', 'Specify a batch text file of youtube urls (LR separated) and download them all')
        .option('-i, --info [url]', 'Get list of quality options for that youtube content')
        .option('-I, --batch_info [file]', 'Specify a batch text file and get audio quality info of all youtube urls')
        .option('-q, --quality [id]', "Specify quality of audio (Default is 140).\n\n        More info: https://en.wikipedia.org/wiki/YouTube#Quality_and_formats\n        [id]\n        140\t M4A  AAC  128'bps\n        141\t M4A  AAC  256'bps (No longer available.)\n        ", '140')
        .parse(process.argv);
    // Check if url is a valid youtube link.
    // Download youtube content as audio.
    if (program.url) {
        var url_1 = program.url;
        var quality = program.quality;
        // Example get meta data of youtube video.
        ytdl.getInfo(url_1, function (err, info) {
            var audio_file_meta = new YTAudioFileMeta(info);
            var file_type = '.m4a';
            // Remove unneeded characters and replace with underscores for readability and make it file friendly.
            var file_name = audio_file_meta.title.replace(/[^a-z]+/gi, '_').toLowerCase() + file_type; // music_title.m4a
            var write_stream = fs.createWriteStream(file_name);
            var audio = ytdl(url_1, { quality: 140 });
            audio.pipe(write_stream);
            audio.on('response', function (res) {
                var dataRead = 0;
                var totalSize = parseInt(res.headers['content-length']);
                var options = {
                    complete: '\u001b[42m \u001b[0m',
                    incomplete: '\u001b[41m \u001b[0m',
                    width: 20,
                    total: totalSize
                };
                //Example download youtube audio and save as .m4a with a progressbar.
                var bar = new ProgressBar(" downloading [:bar] :percent :etas :current/:total - " + file_name, options);
                res.on('data', function (data) {
                    var chunk = data.length;
                    bar.tick(chunk);
                });
            });
            audio.on('finish', function () {
            });
            audio.on('error', function () {
            });
        });
        return;
    }
    // Get itag info and output to console.
    if (program.info) {
        var url = program.info;
        ytdl.getInfo(url, function (err, info) {
            var audio_file_meta = new YTAudioFileMeta(info);
            var title = info.title.replace(/[^a-z]+/gi, '_').toLowerCase(); // music_title.
            var formats = audio_file_meta.formats;
            var itag_info = [];
            function push(itag) {
                itag_info.push({
                    title: title,
                    itag: formats[itag].itag.toString(),
                    encoding: formats[itag].audioEncoding.toString(),
                    bitrate: formats[itag].audioBitrate.toString()
                });
            }
            for (var itag in formats) {
                var found = false;
                if (itag === '139')
                    push(itag);
                if (itag === '140')
                    push(itag);
                if (itag === '141')
                    push(itag);
            }
            console.log();
            console.table(itag_info);
        });
        return;
    }
    // Get Itag info for a batch of youtube urls.
    if (program.batch_info) {
        // Example: Read from a file of youtube links separated by linefeeds.
        var youtube_urls = fs.readFileSync('batch.txt').toString().split("\n");
        var getInfo_promises = [];
        var itag_info_1 = [];
        var _loop_1 = function (url) {
            var promise = getInfo(url).then(function (info) {
                var audio_file_meta = new YTAudioFileMeta(info);
                var title = info.title.replace(/[^a-z]+/gi, '_').toLowerCase(); // music_title.
                var formats = audio_file_meta.formats;
                function push(itag) {
                    itag_info_1.push({
                        title: title,
                        itag: formats[itag].itag.toString(),
                        encoding: formats[itag].audioEncoding.toString(),
                        bitrate: formats[itag].audioBitrate.toString(),
                        url: url
                    });
                }
                for (var itag in formats) {
                    if (itag === '139')
                        push(itag);
                    if (itag === '140')
                        push(itag);
                    if (itag === '141')
                        push(itag);
                }
                return itag_info_1;
            });
            getInfo_promises.push(promise);
        };
        for (var _i = 0, youtube_urls_1 = youtube_urls; _i < youtube_urls_1.length; _i++) {
            var url = youtube_urls_1[_i];
            _loop_1(url);
        }
        Promise.map(getInfo_promises, function (info) {
            // Do only one request at a time using concurrency.
        }, { concurrency: 1 }).then(function () {
            console.log(itag_info_1);
        });
        return;
    }
    // Download a batch of youtube urls in audio format.
    if (program.batch) {
        // Example: Read from a file of youtube links separated by linefeeds.
        var youtube_urls = fs.readFileSync('batch.txt').toString().split("\n");
        var download_promises = [];
        var itag_info = [];
        for (var _a = 0, youtube_urls_2 = youtube_urls; _a < youtube_urls_2.length; _a++) {
            var url = youtube_urls_2[_a];
            var promise = YTdownloadAsAudio(url);
            download_promises.push(promise);
        }
        Promise.map(download_promises, function (result) {
            // Do only one request at a time using concurrency.
        }, { concurrency: 1 }).then(function (result) {
        });
        return;
    }
    function getInfo(url) {
        return new Promise(function (resolve, reject) {
            ytdl.getInfo(url, function (err, info) {
                if (info)
                    resolve(info);
                if (err)
                    reject(err);
            });
        });
    }
    function YTdownloadAsAudio(url) {
        return new Promise(function (resolve, reject) {
            ytdl.getInfo(url, function (err, info) {
                var audio_file_meta = new YTAudioFileMeta(info);
                var file_type = '.m4a';
                // Remove unneeded characters and replace with underscores for readability and make it file friendly.
                var file_name = audio_file_meta.title.replace(/[^a-z]+/gi, '_').toLowerCase() + file_type; // music_title.m4a
                var write_stream = fs.createWriteStream(file_name);
                var audio = ytdl(url, { quality: 140 });
                audio.pipe(write_stream);
                audio.on('response', function (res) {
                    var dataRead = 0;
                    var totalSize = parseInt(res.headers['content-length']);
                    var options = {
                        complete: '\u001b[42m \u001b[0m',
                        incomplete: '\u001b[41m \u001b[0m',
                        width: 20,
                        total: totalSize
                    };
                    //Example download youtube audio and save as .m4a with a progressbar.
                    var bar = new ProgressBar(" downloading [:bar] :percent :etas :current/:total - " + file_name, options);
                    res.on('data', function (data) {
                        var chunk = data.length;
                        bar.tick(chunk);
                    });
                });
                audio.on('finish', function () {
                    resolve(true);
                });
                audio.on('error', function () {
                    reject(false);
                });
            });
        });
    }
}
var YTAudioFileFormat = (function () {
    function YTAudioFileFormat(data) {
        this.itag = Number(data.itag);
        this.container = data.container;
        this.audioEncoding = data.audioEncoding;
        this.audioBitrate = data.audioBitrate;
        this.url = data.url;
    }
    return YTAudioFileFormat;
}());
var YTAudioFileMeta = (function () {
    function YTAudioFileMeta(data) {
        this.title = data.title;
        this.author = data.author;
        this.length_seconds = Number(data.length_seconds);
        this.description = data.description;
        this.view_count = Number(data.view_count);
        this.formats = {};
        for (var _i = 0, _a = data.formats; _i < _a.length; _i++) {
            var format = _a[_i];
            this.formats[format.itag] = format;
        }
    }
    return YTAudioFileMeta;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsZ0NBQW1DO0FBRW5DLG1DQUFzQztBQUN0Qyx1QkFBMEI7QUFDMUIsc0NBQXlDO0FBRXpDLGtDQUFxQztBQUNyQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFFekI7Ozs7Ozs7OztHQVNHO0FBRUgsb0JBQW9CO0FBQ3BCLElBQUksRUFBRSxDQUFDO0FBRVAsZ0JBQWdCO0FBQ2hCO0lBQ0ksT0FBTztTQUNGLE9BQU8sQ0FBQyxPQUFPLENBQUM7U0FDaEIsV0FBVyxDQUNaLDZZQVErRCxDQUM5RDtTQUNBLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxtQ0FBbUMsQ0FBQztTQUM5RCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsZ0ZBQWdGLENBQUM7U0FDOUcsTUFBTSxDQUFDLGtCQUFrQixFQUFFLHNEQUFzRCxDQUFDO1NBQ2xGLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSwwRUFBMEUsQ0FBQztTQUM3RyxNQUFNLENBQUMsb0JBQW9CLEVBQzVCLDZPQU1DLEVBQUUsS0FBSyxDQUFDO1NBQ1IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV6Qix3Q0FBd0M7SUFFeEMscUNBQXFDO0lBQ3JDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2QsSUFBSSxLQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN0QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQzlCLDBDQUEwQztRQUMxQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUcsRUFBRSxVQUFDLEdBQUcsRUFBRSxJQUFJO1lBQ3hCLElBQUksZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hELElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQztZQUN2QixxR0FBcUc7WUFDckcs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