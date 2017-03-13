"use strict";
var ytdl = require("ytdl-core");
var program = require("commander");
var fs = require("fs");
var ProgressBar = require("progress");
var Promise = require("bluebird");
require('console.table');
/*
 * 02/01/2017
 *
 * https://en.wikipedia.org/wiki/YouTube#Quality_and_formats
 * itag container encoding bitrate
 * 140	M4A	AAC	128
 * 141	M4A	AAC	256
 */
// Run main routine,
main();
// Main routine.
function main() {
    program
        .version('0.1.0')
        .description("audl - A convenient node command-line app to download youtube audio content such as podcasts and music.\n\n            Examples:\n\n            audl -d https://www.youtube.com/watch?v=9bZkp7q19f0\n            audl -i https://www.youtube.com/watch?v=9bZkp7q19f0\n            audl -b batch.txt\n            audl -bi batch.txt\n            audl -q https://www.youtube.com/watch?v=9bZkp7q19f0 -q 141")
        .option('-d, --url [url]', 'Specify youtube link to download.')
        .option('-b, --batch [file]', 'Specify a batch text file of youtube urls (LR separated) and download them all')
        .option('-i, --info [url]', 'Get list of quality options for that youtube content')
        .option('-bi --batch_info [file]', 'Specify a batch text file and get audio quality info of all youtube urls')
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsZ0NBQW1DO0FBRW5DLG1DQUFzQztBQUN0Qyx1QkFBMEI7QUFDMUIsc0NBQXlDO0FBRXpDLGtDQUFxQztBQUNyQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFFekI7Ozs7Ozs7R0FPRztBQUVILG9CQUFvQjtBQUNwQixJQUFJLEVBQUUsQ0FBQztBQUVQLGdCQUFnQjtBQUNoQjtJQUNJLE9BQU87U0FDRixPQUFPLENBQUMsT0FBTyxDQUFDO1NBQ2hCLFdBQVcsQ0FDWiw2WUFRK0QsQ0FDOUQ7U0FDQSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsbUNBQW1DLENBQUM7U0FDOUQsTUFBTSxDQUFDLG9CQUFvQixFQUFFLGdGQUFnRixDQUFDO1NBQzlHLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxzREFBc0QsQ0FBQztTQUNsRixNQUFNLENBQUMseUJBQXlCLEVBQUUsMEVBQTBFLENBQUM7U0FDN0csTUFBTSxDQUFDLG9CQUFvQixFQUM1Qiw2T0FNQyxFQUFFLEtBQUssQ0FBQztTQUNSLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFekIsd0NBQXdDO0lBRXhDLHFDQUFxQztJQUNyQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNkLElBQUksS0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUM5QiwwQ0FBMEM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFHLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSTtZQUN4QixJQUFJLGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDdkIscUdBQXFHO1lBQ3JHLElB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