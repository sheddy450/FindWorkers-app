import { describe, it, expect } from "vitest";
import { stockPhotoFor } from "../src/lib/photos/stock";
import { glyphFor } from "../src/components/photos/TradePlaceholder";

const same = (a: string, b: string) => expect(stockPhotoFor(a).id).toBe(stockPhotoFor(b).id);

describe("new trades: example photos by name and keyword", () => {
  it("matches each new trade's display name to its own photo", () => {
    same("Welder & fabricator", "welder");
    same("Bricklayer & mason", "bricklayer");
    same("Furniture maker", "furniture-maker");
    same("Upholsterer", "upholsterer");
    same("Shoemaker & leatherworker", "shoemaker");
    same("Embroiderer", "embroiderer");
    same("Aso-oke weaver", "aso-oke-weaver");
    same("Jeweller (gold & silver)", "jeweller");
    same("Watch repairer", "watch-repairer");
    same("Baker & cake maker", "baker");
  });
  it("matches similar names an admin might type", () => {
    same("Iron gate fabrication", "welder");
    same("Burglary proof installer", "welder");
    same("Block laying", "bricklayer");
    same("Sofa repairs", "upholsterer");
    same("Cobbler", "shoemaker");
    same("Kente weaving", "aso-oke-weaver");
    same("Goldsmith", "jeweller");
    same("Clock repair", "watch-repairer");
    same("Cakes & pastries", "baker");
    same("Wardrobe and kitchen cabinets", "furniture-maker");
  });
  it("keeps the existing trades' matches", () => {
    same("Carpenter", "carpenter");
    same("Wood work and roofing", "carpenter");
    same("Tiler", "tiler");
    same("Floor tiling", "tiler");
    same("Tailor", "tailor");
    same("Car mechanic", "mechanic");
    same("Dog walker", "general-fallback-that-matches-nothing");
  });
});

describe("new trades: placeholder icons", () => {
  const generic = glyphFor("Dog walker");
  it("each new trade gets a drawn icon, not the generic toolbox", () => {
    for (const t of ["Welder & fabricator", "Bricklayer & mason", "Furniture maker", "Upholsterer", "Shoemaker & leatherworker", "Embroiderer", "Aso-oke weaver", "Jeweller (gold & silver)", "Watch repairer", "Baker & cake maker"])
      expect(glyphFor(t)).not.toBe(generic);
  });
  it("furniture and embroidery get their own icons, not the carpenter's or tailor's", () => {
    expect(glyphFor("Furniture maker")).not.toBe(glyphFor("Carpenter"));
    expect(glyphFor("Embroiderer")).not.toBe(glyphFor("Tailor"));
  });
});
