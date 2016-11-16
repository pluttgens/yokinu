# Yokinu

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)[![](https://david-dm.org/genjitsugame/yokinu.svg)](https://david-dm.org/genjitsugame/yokinu)[![](https://david-dm.org/genjitsugame/yokinu/dev-status.svg)](https://david-dm.org/genjitsugame/yokinu/?type=dev)


## Requirements

- [babel](.babelrc)

## Configuration

For development purpose, you can set your credentials in `config/config.private.json`.
[It will NOT be pushed when committing](.gitignore#L53)

### [Google play music](https://play.google.com/music/) _currently disabled_

```
{
  ...
  "gmusic": {
    "email": "",
    "password": ""
  },
  ...
}
```

### [Dropbox](https://www.dropbox.com)

```
{
  ...
  "dropbox": {
    "token": "your_token",
    "directories": ['/music_dir_1', '/music_dir_2']
  },
  ...
}
```

## Run

- `npm run dev`

## Tests
