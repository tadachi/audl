"use strict";
var ytdl = require("ytdl-core");
var bunyan = require("bunyan");
var log = bunyan.createLogger({
    name: 'audl',
    level: 0
});
/*
 * 02/01/2017
 *
 * https://en.wikipedia.org/wiki/YouTube#Quality_and_formats
 * itag container encoding bitrate
 * 140	M4A	AAC	128
 * 141	M4A	AAC	256
 * 171	WebM Vorbis	128
 * 249	WebM Opus 48
 * 250	WebM Opus 64
 * 251	WebM Opus 160
 */
// var prompt = require('prompt');
var jsonfile = require("jsonfile");
var file = 'data.json';
// prompt.get(['fileName'], function (err, result) {
//   if (err) { return onErr(err); }
//   console.log(result.fileName);
// });
// ytdl('https://www.youtube.com/watch?v=1gdpyzwOOYY', { quality: '140' })
//   .pipe(fs.createWriteStream('itag_140.m4a'));
ytdl.getInfo('https://www.youtube.com/watch?v=1gdpyzwOOYY', function (err, info) {
    // let audio_file = new YTAudioFileFormat(findITAG('249', info['formats']));
    var audio_file_meta = new YTAudioFileMeta(info);
    jsonfile.writeFileSync(file, audio_file_meta, function (err) {
        if (err)
            log.info(err);
    });
});
var findITAG = function (itag_to_search, formats) {
    for (var _i = 0, formats_1 = formats; _i < formats_1.length; _i++) {
        var format = formats_1[_i];
        if (format.itag == itag_to_search) {
            return format;
        }
    }
    return null;
};
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
