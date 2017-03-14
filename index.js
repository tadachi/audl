#!/usr/bin/env node
"use strict";
exports.__esModule = true;
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
        .version('0.2.2')
        .description("audl - A convenient node command-line app to download youtube audio content such as podcasts and music.\n\n            Examples:\n\n            audl -d https://www.youtube.com/watch?v=9bZkp7q19f0\n            audl -i https://www.youtube.com/watch?v=9bZkp7q19f0\n            audl -b batch.txt\n            audl -I batch.txt")
        .option('-d, --url [url]', 'Specify youtube link to download.')
        .option('-b, --batch [file]', 'Specify a batch text file of youtube urls (LR separated) and download them all')
        .option('-i, --info [url]', 'Get list of quality options for that youtube content')
        .option('-I, --batch_info [file]', 'Specify a batch text file and get audio quality info of all youtube urls')
        .parse(process.argv);
    // Check if url is a valid youtube link.
    function valid_youtube_match(url) {
        var youtube_valid_regexp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        var match = url.match(youtube_valid_regexp);
        if (match && match[2].length == 11) {
            return true;
        }
        else {
            return false;
        }
    }
    // Download youtube content as audio.
    if (program.url) {
        var url_1 = program.url;
        if (!valid_youtube_match(url_1)) {
            console.log(program.url + 'is not a valid youtube url.');
            return;
        }
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
        // Check if valid url.
        if (!valid_youtube_match(url)) {
            console.log(url + 'is not a valid youtube url.');
            return;
        }
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
        var youtube_urls = fs.readFileSync('batch.txt').toString().split("\r");
        var getInfo_promises = [];
        var itag_info_1 = [];
        var _loop_1 = function (url) {
            // Remove \r \n from string before validating.
            url = url.replace(/(\r\n|\n|\r)/gm, "");
            if (!valid_youtube_match(url)) {
                console.log(url + ' is not a valid youtube url.');
                return "continue";
            }
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
            console.log();
            console.table(itag_info_1);
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
            // Remove \r \n from string before validating.
            url = url.replace(/(\r\n|\n|\r)/gm, "");
            if (!valid_youtube_match(url)) {
                console.log(url + 'is not a valid youtube url and will not be downloaded.');
                continue;
            }
            var promise = YTdownloadAsAudio(url);
            // Check if valid url. 
            download_promises.push(promise);
        }
        Promise.map(download_promises, function (result) {
            // Do only one request at a time using concurrency.
        }, { concurrency: 1 }).then(function (result) {
        });
        return;
    }
    // If program was called with no arguments, show help.
    if (program.args.length === 0)
        program.help();
    // Return a promise to get youtube info such as itag, quality, bitrate.
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
    // Return a promise to download youtube audio content.
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
