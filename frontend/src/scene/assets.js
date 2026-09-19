/**
 * Asset registry for textures and item visual overrides.
 * Set item paths to a valid image URL/path (e.g. "/scene/items/glasses.png")
 * to override vector SVG artwork with real photographic cutouts.
 */

export const TEXTURES = {
  cardboard: "/scene/tex/cardboard.png",
  wood: "/scene/tex/wood.png",
  paper: "/scene/tex/paper.png",
  tape: "/scene/tex/tape.png",
};

export const ITEM_ASSET_OVERRIDES = {
  glasses: null,   // e.g. "/scene/items/glasses.png"
  phone: null,     // e.g. "/scene/items/phone.png"
  notebook: null,  // e.g. "/scene/items/notebook.png"
  wallet: null,    // e.g. "/scene/items/wallet.png"
  scarf: null,     // e.g. "/scene/items/scarf.png"
};
