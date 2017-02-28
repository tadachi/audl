import ytdl = require('ytdl-core');
import bunyan = require('bunyan');
import jsonfile = require('jsonfile');
import program = require('commander');
import fs = require('fs');
import ProgressBar = require('progress');
import https = require('https');


var log = bunyan.createLogger({
    name: 'audl',
    streams: [{
        path: './log.json',
    }],
    src: false,
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

// Run main routine,
main();

// Main routine.
function main() {
    let url = 'https://www.youtube.com/watch?v=RyoMQg3d5cs';
    // Example get meta data of youtube video.
    ytdl.getInfo('https://www.youtube.com/watch?v=RyoMQg3d5cs', function (err, info) {
        let audio_file_meta = new YTAudioFileMeta(info);
        let file_type = '.m4a';
        let file_name = info.title.replace(/[^a-z0-9()]/gi, '_').toLowerCase() + file_type;
        // console.log(file_name);
        let write_stream = fs.createWriteStream(file_name);
        // console.log(write_stream);
        // write_stream.write = function(chunk, enc, next) {
        //     console.dir(chunk);
        //     next;
        // };

        let audio = ytdl('https://www.youtube.com/watch?v=RyoMQg3d5cs', { quality: '140' })
        audio.pipe(write_stream);
        audio.on('response', function (res) {
            let dataRead = 0;
            let totalSize = parseInt(res.headers['content-length']);
            let options = {
                complete: '\u001b[42m \u001b[0m',
                incomplete: '\u001b[41m \u001b[0m',
                width: 20,
                total: totalSize
            }
            //Example download youtube audio and save as .m4a with a progressbar.
            let bar = new ProgressBar(` downloading [:bar] :percent :etas :current/:total - ${file_name}`, options);

            res.on('data', function (data) {
                let chunk = data.length;
                bar.tick(chunk)
            })
            // res.on('end', function () {
            //     process.stdout.write('\n');
            // });
        });
    })

    ytdl.getInfo('https://www.youtube.com/watch?v=8pugCghACV0', function (err, info) {
        let audio_file_meta = new YTAudioFileMeta(info);
        let file_type = '.m4a';
        let file_name = info.title.replace(/[^a-z0-9()]/gi, '_').toLowerCase() + file_type;
        // console.log(file_name);
        let write_stream = fs.createWriteStream(file_name);
        // console.log(write_stream);
        // write_stream.write = function(chunk, enc, next) {
        //     console.dir(chunk);
        //     next;
        // };

        let audio = ytdl('https://www.youtube.com/watch?v=8pugCghACV0', { quality: '140' })
        audio.pipe(write_stream);
        audio.on('response', function (res) {
            let dataRead = 0;
            let totalSize = parseInt(res.headers['content-length']);
            let options = {
                complete: '\u001b[42m \u001b[0m',
                incomplete: '\u001b[41m \u001b[0m',
                width: 20,
                total: totalSize
            }
            //Example download youtube audio and save as .m4a with a progressbar.
            let bar = new ProgressBar(` downloading [:bar] :percent :etas :current/:total - ${file_name}`, options);

            res.on('data', function (data) {
                let chunk = data.length;
                bar.tick(chunk)
            })
            // res.on('end', function () {
            //     process.stdout.write('\n');
            // });
        });
    })

    // let file: string = 'data.json';

    // program
    //   .version('0.0.1')
    //   .option('-f, --file [file]', 'Specify file name')
    //   .option('-l, --link [url]', 'Specify youtube link to download')
    //   .option('-b, --batch [file]', 'Specify a batch text file')
    //   .parse(process.argv);

    // if (program.file) console.log(program.file);
    // if (program.link) console.log(program.link);
    // if (program.batch) console.log(program.batch);

    // // Example: Read from a file of youtube links separated by linefeeds.
    // var array = fs.readFileSync('batch.txt').toString().split("\n");
    // for (let i in array) {
    //     console.log(array[i]);
    //     ytdl.getInfo(array[i], function (err, info) {
    //         console.log(info.title);
    //         let filename = info.title.replace(/[^a-z0-9()]/gi, '_').toLowerCase();
    //         console.log(filename);
    //     });
    // }

    // // Example get meta data of youtube video.
    // ytdl.getInfo('https://www.youtube.com/watch?v=1gdpyzwOOYY', function (err, info) {
    //     let audio_file_meta = new YTAudioFileMeta(info);

    //     // Write to log file.
    //     jsonfile.writeFileSync(file, audio_file_meta, function (err) {
    //         if (err)
    //             log.info(err);

    //         log.info('Successfully wrote to ' + file);
    //     }(log));
    // })

}

// Get a specific itag in youtube data
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