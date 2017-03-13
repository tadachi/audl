import ytdl = require('ytdl-core');
import jsonfile = require('jsonfile');
import program = require('commander');
import fs = require('fs');
import ProgressBar = require('progress');
import https = require('https');
import Promise = require('bluebird');
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
        .description(
        `audl - A convenient node command-line app to download youtube audio content such as podcasts and music.

            Examples:

            audl -d https://www.youtube.com/watch?v=9bZkp7q19f0
            audl -i https://www.youtube.com/watch?v=9bZkp7q19f0
            audl -b batch.txt
            audl -bi batch.txt
            audl -q https://www.youtube.com/watch?v=9bZkp7q19f0 -q 141`
        )
        .option('-d, --url [url]', 'Specify youtube link to download.')
        .option('-b, --batch [file]', 'Specify a batch text file of youtube urls (LR separated) and download them all')
        .option('-i, --info [url]', 'Get list of quality options for that youtube content')
        .option('-bi --batch_info [file]', 'Specify a batch text file and get audio quality info of all youtube urls')
        .option('-q, --quality [id]',
        `Specify quality of audio (Default is 140).

        More info: https://en.wikipedia.org/wiki/YouTube#Quality_and_formats
        [id]
        140	 M4A  AAC  128'bps
        141	 M4A  AAC  256'bps (No longer available.)
        `, '140')
        .parse(process.argv);

    // Check if url is a valid youtube link.

    // Download youtube content as audio.
    if (program.url) {
        let url = program.url;
        let quality = program.quality;
        // Example get meta data of youtube video.
        ytdl.getInfo(url, (err, info) => {
            let audio_file_meta = new YTAudioFileMeta(info);
            let file_type = '.m4a';
            // Remove unneeded characters and replace with underscores for readability and make it file friendly.
            let file_name = audio_file_meta.title.replace(/[^a-z]+/gi, '_').toLowerCase() + file_type; // music_title.m4a
            let write_stream = fs.createWriteStream(file_name);
            let audio = ytdl(url, { quality: 140 })
            audio.pipe(write_stream);
            audio.on('response', (res) => {
                let dataRead = 0;
                let totalSize = parseInt(res.headers['content-length']);
                let options = {
                    complete: '\u001b[42m \u001b[0m', // Green.
                    incomplete: '\u001b[41m \u001b[0m', // Red.
                    width: 20,
                    total: totalSize
                }
                //Example download youtube audio and save as .m4a with a progressbar.
                let bar = new ProgressBar(` downloading [:bar] :percent :etas :current/:total - ${file_name}`, options);

                res.on('data', (data) => {
                    let chunk = data.length;
                    bar.tick(chunk)
                })
            });
            audio.on('finish', () => {
            })
            audio.on('error', () => {
            });
        })

        return;
    }

    // Get itag info and output to console.
    if (program.info) {
        let url = program.info;
        ytdl.getInfo(url, (err, info) => {
            let audio_file_meta = new YTAudioFileMeta(info);
            let title = info.title.replace(/[^a-z]+/gi, '_').toLowerCase(); // music_title.
            let formats = audio_file_meta.formats;
            let itag_info = [];

            function push(itag) {
                itag_info.push({
                    title: title,
                    itag: formats[itag].itag.toString(),
                    encoding: formats[itag].audioEncoding.toString(),
                    bitrate: formats[itag].audioBitrate.toString(),
                })
            }

            for (let itag in formats) {
                let found = false;
                if (itag === '139') push(itag)
                if (itag === '140') push(itag)
                if (itag === '141') push(itag)
            }

            console.log();
            console.table(itag_info);
        })

        return;
    }

    // Get Itag info for a batch of youtube urls.
    if (program.batch_info) {
        // Example: Read from a file of youtube links separated by linefeeds.
        var youtube_urls = fs.readFileSync('batch.txt').toString().split("\n");
        let getInfo_promises = [];
        let itag_info = [];

        for (let url of youtube_urls) {
            let promise = getInfo(url).then((info) => {
                let audio_file_meta = new YTAudioFileMeta(info);
                let title = info.title.replace(/[^a-z]+/gi, '_').toLowerCase(); // music_title.
                let formats = audio_file_meta.formats;

                function push(itag) {
                    itag_info.push({
                        title: title,
                        itag: formats[itag].itag.toString(),
                        encoding: formats[itag].audioEncoding.toString(),
                        bitrate: formats[itag].audioBitrate.toString(),
                        url: url
                    });
                }

                for (let itag in formats) {
                    if (itag === '139') push(itag);
                    if (itag === '140') push(itag);
                    if (itag === '141') push(itag);
                }

                return itag_info;
            })

            getInfo_promises.push(promise);
        }

        Promise.map(getInfo_promises, (info) => {
            // Do only one request at a time using concurrency.
        }, { concurrency: 1 }).then(function () {
            console.log(itag_info);
        });
        return;
    }

    // Download a batch of youtube urls in audio format.
    if (program.batch) {
        // Example: Read from a file of youtube links separated by linefeeds.
        var youtube_urls = fs.readFileSync('batch.txt').toString().split("\n");
        let download_promises = [];
        let itag_info = [];

        for (let url of youtube_urls) {
            let promise = YTdownloadAsAudio(url);
            download_promises.push(promise);
        }

        Promise.map(download_promises, (result) => {
            // Do only one request at a time using concurrency.
        }, { concurrency: 1 }).then(function (result) {
        });
        return;
    }

    function getInfo(url) {
        return new Promise(function (resolve, reject) {
            ytdl.getInfo(url, function (err, info) {
                if (info) resolve(info)
                if (err) reject(err);
            })
        })
    }

    function YTdownloadAsAudio(url) {
        return new Promise(function (resolve, reject) {
            ytdl.getInfo(url, function (err, info) {
                let audio_file_meta = new YTAudioFileMeta(info);
                let file_type = '.m4a';
                // Remove unneeded characters and replace with underscores for readability and make it file friendly.
                let file_name = audio_file_meta.title.replace(/[^a-z]+/gi, '_').toLowerCase() + file_type; // music_title.m4a
                let write_stream = fs.createWriteStream(file_name);
                let audio = ytdl(url, { quality: 140 })
                audio.pipe(write_stream);
                audio.on('response', function (res) {
                    let dataRead = 0;
                    let totalSize = parseInt(res.headers['content-length']);
                    let options = {
                        complete: '\u001b[42m \u001b[0m', // Green.
                        incomplete: '\u001b[41m \u001b[0m', // Red.
                        width: 20,
                        total: totalSize
                    }
                    //Example download youtube audio and save as .m4a with a progressbar.
                    let bar = new ProgressBar(` downloading [:bar] :percent :etas :current/:total - ${file_name}`, options);

                    res.on('data', function (data) {
                        let chunk = data.length;
                        bar.tick(chunk)
                    })
                });
                audio.on('finish', () => {
                    resolve(true);
                });
                audio.on('error', () => {
                    reject(false);
                });

            })
        });

    }
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