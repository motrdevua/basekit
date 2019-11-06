# basekit

Simple start template.

## Installation

1. `git clone https://github.com/motrdevua/basekit.git`
2. `npm install`

### Generate required fonts (ttf, eot, woff, woff2, svg) from a ttf file

1. Put ttf file to the directory `'src/fonts/'`.
2. Run `gulp fontgen`
3. Find file: `'blocks/utils/_fonttylesheet.sass'`.
4. Add font name like: `+font-face("fontname", "../fonts/fontname", font-style, font-weight)`

- Example:
-     +font-face('Montserrat', '../fonts/Montserrat-Black', normal, 900)

### How to use sprites

#### PNG

1. Uncomment `'spritePng'` in `'build'` task in `gulpfile.js`.
2. Put \*.png icons into folder `src/img/png`.
3. Find `'main.sass'` and uncomment strings:
   `@import 'utils/mixin-spritePng';`
   `@import 'tmp/spritePng';`

4. Put icon into scss file with mixin `+sprite($iconname)`

- Example:
-     .icon
-       +sprite($iconname)

#### SVG

1. Uncomment `'spriteSvg'` in `'build'` task in `gulpfile.js`
2. Uncomment string `@import 'tmp/spriteSvg';` in `'main.sass'`.
3. Uncomment string `//=include spriteSvg.svg` in `'index.html'`.
4. Add icon as:

- Example:
-     <svg class="icon icon-name">
        <use xlink:href="#name"></use>
      </svg>

---

### Run gulp in development mode

`npm run dev`

### Make build

`npm run build`

### Сlear

`npm run clean`

### Generate smart-grid

`npm run grid`

---

_Enjoy!_
