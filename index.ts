import ytdl = require('ytdl-core');
import bunyan = require('bunyan');

var log = bunyan.createLogger({
    name: 'audl',
    streams: [{
        path: './audl.log',
    }],
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
import jsonfile = require('jsonfile');
let file: string = 'data.json';

// prompt.get(['fileName'], function (err, result) {
//   if (err) { return onErr(err); }
//   console.log(result.fileName);
// });

// ytdl('https://www.youtube.com/watch?v=1gdpyzwOOYY', { quality: '140' })
//   .pipe(fs.createWriteStream('itag_140.m4a'));

ytdl.getInfo('https://www.youtube.com/watch?v=1gdpyzwOOYY', function (err, info) {
    // let audio_file = new YTAudioFileFormat(findITAG('249', info['formats']));
    let audio_file_meta = new YTAudioFileMeta(info);

    jsonfile.writeFileSync(file, audio_file_meta, function (err) {
        if (err) 
            log.info(err);

        log.info('Successfully wrote to ' + file);
    }(log))

})

let findITAG = function (itag_to_search: string, formats): Object {

    for (let format of formats) {
        if (format.itag == itag_to_search) {
            return format;
        }
    }

    return null;
}

interface AudioFileFormatsInterface {
    itag: number;
    container: string;
    audioEncoding: string;
    audioBitrate: string;
    url: string;
}

interface AudioFileMetaInterface {
    title: string;
    author: string;
    length_seconds: number;
    description: string;
    view_count: number;
    formats: any;
}

class YTAudioFileFormat implements AudioFileFormatsInterface {
    itag: number;
    container: string;
    audioEncoding: string;
    audioBitrate: string;
    url: string;

    constructor(data: any) {
        this.itag = Number(data.itag);
        this.container = data.container;
        this.audioEncoding = data.audioEncoding;
        this.audioBitrate = data.audioBitrate;
        this.url = data.url;
    }
}

class YTAudioFileMeta implements AudioFileMetaInterface {
    title: string;
    author: string;
    length_seconds: number;
    description: string;
    view_count: number;
    formats: any;

    constructor(data: any) {
        this.title = data.title;
        this.author = data.author;
        this.length_seconds = Number(data.length_seconds);
        this.description = data.description;
        this.view_count = Number(data.view_count);
        this.formats = {};
        for (let format of data.formats) {
            this.formats[format.itag] = format;
        }
    }
}