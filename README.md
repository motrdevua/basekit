# basekit

Simple start template.

## Installation

1. `git clone https://github.com/motrdevua/basekit.git`
2. `npm install`

### Generate required fonts (ttf, eot, woff, woff2, svg) from a ttf file

1. Put ttf file to the directory `'src/fonts/'`.
2. Run `gulp fontgen`
3. Find file: `'blocks/utils/_fonttylesheet.scss'`.
4. Add font name like: `@include font-face("fontname", "../fonts/fontname", font-style, font-weight);`

-   Example:
-       @include font-face('Montserrat', '../fonts/Montserrat-Black', normal, 900);

---

### Run gulp in development mode

`npm run dev`

### Make build

`npm run build`

### Сlear

`npm run clean`

---

_Enjoy!_
