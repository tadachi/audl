import ytdl = require('ytdl-core');

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
    console.log(audio_file_meta);
    
    jsonfile.writeFile(file, audio_file_meta, function (err) {
        if (err) return console.log(err);
    })
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
    formats: Map<number, YTAudioFileFormat>;
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
    formats: Map<number, YTAudioFileFormat> = new Map<number, YTAudioFileFormat>();

    constructor(data: any) {
        this.title = data.title;
        this.author = data.author;
        this.length_seconds = Number(data.length_seconds);
        this.description = data.description;
        this.view_count = Number(data.view_count);
        for (let format of data.formats) {
            this.formats.set(format.itag, format);
        }
    }
}