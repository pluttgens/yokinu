# Yokinu

## Requirements

- docker

if no docker :

- node 9+ with `--experimental-modules` flag
- MariaDB
- Elasticsearch
- ffmpeg


## Configuration

For development purpose, you can set your credentials in `config/local.json`.
[It will NOT be pushed when committing](.gitignore#L113)

### Services

- local

Uses file system to both load and store your library.

```
{
  ...
  "local": {
      "active": true,
      "data_dir": "/data/yokinu/library"
   }
  ...
}
```

- [Google play music](https://play.google.com/music/) _currently disabled_

Authentication to google play music can either be done via `email`/`password` or by providing one of your device's `androidId`/`masterToken`.

```
{
  ...
 "gmusic": {
      "active": true
      "email": "user@gmail.com",
      "password": "hunter2",
      "androidId": "",
      "masterToken": "",
    },
  ...
}
```

- [Dropbox](https://www.dropbox.com)

Use dropbox to both load and store store your library.

```
{
  ...
  "dropbox": {
    "active": true
    "token": "your_token",
    "directories": ['/music_dir_1', '/music_dir_2'],
  },
  ...
}
```

## Run

### docker

- start : `npm run up`
- stop : `npm run down`


### without docker

- `npm run dev`

## Tests
