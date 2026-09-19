/**
 * Optional REAL photos for the landing scene.
 *
 * By default the scene is drawn with detailed vector art + procedural cardboard
 * and wood textures (see /tools/make-textures.py). To use your own real photos,
 * drop transparent PNG cut-outs into /public/scene/ and fill in the entries
 * below. Anything left as `null` falls back to the built-in vector version.
 *
 * Item coordinates are LOCAL to the item's centre (0,0). `width`/`height` are
 * in scene units (the scene canvas is 1200 x 800; a phone is ~52 x 100).
 *
 * Box layers use the same 1200 x 800 canvas as the scene. `boxBack` is drawn
 * behind the items (the inside of the box), `boxFront` in front of them (the
 * front panel + label), so items look like they sit INSIDE the box.
 */
export const SCENE_ASSETS = {
  // full-bleed library photo, e.g. { src: "/scene/library.jpg" } (1200x800 or bigger, 3:2)
  background: null,

  // e.g. { src: "/scene/box-back.png", x: 440, y: 500, width: 320, height: 240 }
  boxBack: null,
  boxFront: null,

  // e.g. glasses: { src: "/scene/glasses.png", width: 150, height: 60 }
  items: {
    glasses: null,
    phone: null,
    book: null,
    wallet: null,
    scarf: null,
  },
};
