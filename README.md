audl
=========

#### Description

Quickly and conveniently download music, podcasts or audio from Youtube.

Has options for batch and checking bitrate of youtube audio.

Special thanks to https://github.com/fent/node-ytdl for his work.

#### Install

```bash
npm -g install audl
```

#### Usage

##### Single download
```
audl -d https://www.youtube.com/watch?v=9bZkp7q19f0
downloading [                    ] 100% 0.0s 4007494/4007494 - psy_gangnam_style_m_v.m4a
```
##### Batch download
```
audl -b batch.txt

downloading [                    ] 100% 0.0s 12386745/12386745 - the_epic_final_fantasy_vi_medley.m4a
downloading [                    ] 100% 0.0s 17081058/17081058 - final_fantasy_epic_orchestral_medley.m4a
downloading [                    ] 100% 0.0s 16404793/16404793 - the_epic_final_fantasy_v_medley.m4a
```
##### Single getinfo
```
audl -i https://www.youtube.com/watch?v=N1QgLqWb0rE

title                             itag  encoding  bitrate
--------------------------------  ----  --------  -------
the_epic_final_fantasy_vi_medley  140   aac       128
```
##### Batch getinfo
```
audl -I batch.txt

title                                 itag  encoding  bitrate  url
------------------------------------  ----  --------  -------  -------------------------------------------
the_epic_final_fantasy_vi_medley      140   aac       128      https://www.youtube.com/watch?v=N1QgLqWb0rE
final_fantasy_epic_orchestral_medley  140   aac       128      https://www.youtube.com/watch?v=1smhVzu_Y7I
the_epic_final_fantasy_v_medley       140   aac       128      https://www.youtube.com/watch?v=Ginfs4TY0oo
```
##### Help
```
  audl -h

  Usage: index [options]

  audl - A convenient node command-line app to download youtube audio content such as podcasts and music.

            Examples:

            audl -d https://www.youtube.com/watch?v=9bZkp7q19f0
            audl -i https://www.youtube.com/watch?v=9bZkp7q19f0
            audl -b batch.txt
            audl -I batch.txt

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -d, --url [url]          Specify youtube link to download.
    -b, --batch [file]       Specify a batch text file of youtube urls (LR separated) and download them al
    -i, --info [url]         Get list of quality options for that youtube content
    -I, --batch_info [file]  Specify a batch text file and get audio quality info of all youtube urls
```

#### tests

To manually test, run these commands.

```
  npm run test_download
  npm run test_getinfo
  npm run test_batch
  npm run test_batch_getinfo
```

#### License

MIT License
 
