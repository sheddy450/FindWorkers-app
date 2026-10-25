/**
 * Example photos for each trade, from Unsplash (free to use under the Unsplash License:
 * https://unsplash.com/license). They make service pages and new artisans' cards look alive before
 * real work photos arrive.
 *
 * Rules (so customers are never misled):
 * - Only for a TRADE (service pages, cards with no approved photos yet), never inside an artisan's
 *   own gallery or profile, and always labelled "Example photo" where it stands in for an artisan.
 * - An artisan's own approved photos always replace it.
 * - Images are loaded from Unsplash's CDN (hotlinking is what Unsplash asks for) and credited.
 * To swap one: open the photo on unsplash.com, copy the "photo-…" id from the image address.
 */
import type { PublicPhoto } from "./display";

type Stock = { id: string; alt: string; by: string; page: string };

const STOCK: Record<string, Stock> = {
  plumber: { id: "photo-1676210133055-eab6ef033ce3", alt: "A plumber fixing the pipes under a sink", by: "Timur Shakerzianov", page: "https://unsplash.com/photos/wzIjLL4KB-4" },
  electrician: { id: "photo-1621905251189-08b45d6a269e", alt: "An electrician in a yellow hard hat installing wiring", by: "Emmanuel Ikwuegbu", page: "https://unsplash.com/photos/_2AlIm-F6pw" },
  "generator-repair": { id: "photo-1700318092011-6e4666e94ab5", alt: "A small petrol generator engine in its frame", by: "Mohannad Alahmad", page: "https://unsplash.com/photos/-XE7uhxtUHM" },
  "ac-fridge": { id: "photo-1765634219706-15729e7a3295", alt: "Air conditioning units mounted on a wall", by: "Salar", page: "https://unsplash.com/photos/HVXmK1wqntk" },
  carpenter: { id: "photo-1687422810663-c316494f725a", alt: "A carpenter smiling as he works on a piece of wood", by: "Ali Mkumbwa", page: "https://unsplash.com/photos/PxlKOcj0a3Q" },
  painter: { id: "photo-1779971685817-77e596abd71a", alt: "A young man painting a wall with a roller", by: "Mugabi Owen", page: "https://unsplash.com/photos/WD-x96N2oPM" },
  tiler: { id: "photo-1523413307857-ef24c53571ae", alt: "A tiler holding a white wall tile in place", by: "charlesdeluvio", page: "https://unsplash.com/photos/LyQi9DS7AEg" },
  mechanic: { id: "photo-1767339736147-676bd47eddb6", alt: "A mechanic working on car engine parts", by: "Zoshua Colah", page: "https://unsplash.com/photos/AB9JRtEqSQQ" },
  cleaner: { id: "photo-1752630167295-07e98da776f9", alt: "A smiling man sweeping inside a doorway", by: "Allan Lainez", page: "https://unsplash.com/photos/VRb8p8-H83g" },
  tailor: { id: "photo-1687422809069-0fa3546b8471", alt: "A tailor smiling as he sews at his machine", by: "Ali Mkumbwa", page: "https://unsplash.com/photos/cU3xxfbB9Es" },
  "phone-laptop-repair": { id: "photo-1550041473-d296a3a8a18a", alt: "A technician repairing an Android smartphone", by: "Clint Bustrillos", page: "https://unsplash.com/photos/K7OUs6y_cm8" },
  "appliance-repair": { id: "photo-1562941995-17dc31eaaf6d", alt: "A technician soldering wires on a repair job", by: "Blaz Erzetic", page: "https://unsplash.com/photos/rP30_20fDpw" },
  welder: { id: "photo-1455165814004-1126a7199f9b", alt: "A welder in a protective helmet and gloves working on metal as sparks fly", by: "Rob Lambert", page: "https://unsplash.com/photos/9Q_pLLP_jmA" },
  bricklayer: { id: "photo-1701850009190-2859ba2aeea6", alt: "A mason spreading cement on a brick wall", by: "Solømen", page: "https://unsplash.com/photos/i6V6diaf71A" },
  "furniture-maker": { id: "photo-1631396326838-de37e5f8bcbc", alt: "A man working on a piece of wood at his workbench", by: "Bailey Alexander", page: "https://unsplash.com/photos/DfffcjQ106U" },
  upholsterer: { id: "photo-1781495140807-a033e49840e4", alt: "Two old upholstered armchairs in the sunlight", by: "X F", page: "https://unsplash.com/photos/SH-JrsRENhI" },
  shoemaker: { id: "photo-1721755563962-7177a7b2e817", alt: "A street cobbler sitting in front of a pile of shoes", by: "Subhro Vision", page: "https://unsplash.com/photos/sl4je6voVvI" },
  embroiderer: { id: "photo-1653220266006-27b87f590eaf", alt: "Close-up of a needle stitching thread into cloth", by: "Kateryna Shevchenko", page: "https://unsplash.com/photos/5u73FX2nYgk" },
  "aso-oke-weaver": { id: "photo-1638310533874-6c124c012e1d", alt: "A woman working at a weaving loom", by: "Joel Heard", page: "https://unsplash.com/photos/XSs7xXS71pM" },
  jeweller: { id: "photo-1772442125267-7640b4b5f2fe", alt: "A woman working on jewellery at a workbench", by: "GN Group", page: "https://unsplash.com/photos/9rdoc89WxP0" },
  "watch-repairer": { id: "photo-1633451238208-11c8e6c1fed4", alt: "Close-up of the gears inside a watch", by: "Lukas Tennie", page: "https://unsplash.com/photos/DAWnMmUSMdU" },
  baker: { id: "photo-1732565649629-eb4932a1ec09", alt: "A baker in an apron sprinkling flour on a table", by: "Maite Paternain", page: "https://unsplash.com/photos/SEb14_nBjc4" },
};
/** For trades added later that match nothing above. */
const GENERAL: Stock = { id: "photo-1787672357491-d43acdf974cb", alt: "A tradesman in a blue work uniform and cap", by: "Divaris Shirichena", page: "https://unsplash.com/photos/F4ox6XvbDps" };

/** Trades added by admins later get the closest match by name. */
const KEYWORDS: [RegExp, string][] = [
  // Specific trades before the general ones that share words with them (furniture vs carpenter, mason vs tiler).
  [/weld|fabricat|iron|gate|burglar|blacksmith/i, "welder"], [/mason|brick|block ?lay/i, "bricklayer"],
  [/furniture|cabinet|wardrobe/i, "furniture-maker"], [/upholster|sofa|couch|foam/i, "upholsterer"],
  [/shoe|cobbler|leather|cordwain|sandal/i, "shoemaker"], [/embroider/i, "embroiderer"],
  [/aso.?oke|weav|loom|kente/i, "aso-oke-weaver"], [/jewel|gold|silver/i, "jeweller"],
  [/watch|clock|horolog/i, "watch-repairer"], [/bake|cake|pastr|confection|bread/i, "baker"],
  [/plumb|pipe|borehole|water/i, "plumber"], [/electric|wiring|solar|inverter/i, "electrician"], [/generator|\bgen\b/i, "generator-repair"],
  [/\bac\b|air ?con|fridge|refrigerat|hvac|freezer/i, "ac-fridge"], [/carpent|wood|joiner/i, "carpenter"],
  [/paint|decor|pop|screed/i, "painter"], [/til|floor/i, "tiler"], [/mechanic|auto|car|vehicle|motor/i, "mechanic"],
  [/clean|laundry|fumigat/i, "cleaner"], [/tailor|fashion|sew|seam/i, "tailor"], [/phone|laptop|computer|gadget/i, "phone-laptop-repair"],
  [/appliance|washing|microwave|tv\b|electronic/i, "appliance-repair"],
];

export type StockPhoto = PublicPhoto & { stock: { by: string; page: string } };

const img = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

/** Example photo for a trade, by slug ("plumber") or name ("AC & fridge technician"). */
export function stockPhotoFor(trade?: string | null): StockPhoto {
  const key = trade ? (STOCK[trade] ? trade : KEYWORDS.find(([re]) => re.test(trade))?.[1]) : undefined;
  const s = (key && STOCK[key]) || GENERAL;
  return {
    id: `stock-${s.id}`, url: img(s.id, 1600), thumbUrl: img(s.id, 480), blur: null, alt: s.alt,
    width: 1600, height: 1067, stock: { by: s.by, page: `${s.page}?utm_source=findworkers&utm_medium=referral` },
  };
}

export const isStock = (p: PublicPhoto | null | undefined): p is StockPhoto => !!p && "stock" in p;
