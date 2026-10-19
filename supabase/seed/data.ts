/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SEED DATA — one easy-to-edit file.
 *  Swap these fictional restaurants for the real 15 when you have them, then run
 *  `npm run seed`. Re-running is safe: rows are matched by slug / phone / name.
 *
 *  Prices are PKR (integers). prep_min must be ≤ 12 to be sellable (fast lane);
 *  a couple of slower items are included on purpose to show they stay hidden.
 *  Coordinates are approximate [lat, lng] in DHA Lahore.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { DEFAULT_ZONE } from "@/config/dha";

export type SeedOption = { id: string; name: string; price_pkr: number };
export type SeedOptionGroup = { id: string; name: string; min: number; max: number; options: SeedOption[] };

export type SeedItem = {
  name: string;
  price: number;
  prep: number;
  emoji?: string;
  desc?: string;
  popular?: boolean;
  options?: SeedOptionGroup[];
};

export type SeedRestaurant = {
  slug: string;
  name: string;
  tagline: string;
  cuisines: string[];
  cluster: keyof typeof CLUSTERS;
  /** Offset from the cluster centre in metres [north, east]. */
  offsetM: [number, number];
  emoji: string;
  gradient: [string, string];
  rating: number;
  ratingCount: number;
  priceLevel: 1 | 2 | 3 | 4;
  hours: [string, string];
  staffName: string;
  menu: { section: string; items: SeedItem[] }[];
};

// ─── Option-group helpers ────────────────────────────────────────────────────
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const opt = (name: string, price_pkr = 0): SeedOption => ({ id: slugify(name), name, price_pkr });
const pickOne = (name: string, options: SeedOption[]): SeedOptionGroup => ({ id: slugify(name), name, min: 1, max: 1, options });
const addOns = (options: SeedOption[], max = options.length, name = "Add-ons"): SeedOptionGroup => ({
  id: slugify(name),
  name,
  min: 0,
  max,
  options,
});
const halfFull = (fullExtra: number) => pickOne("Size", [opt("Half"), opt("Full", fullExtra)]);

// ─── Commercial clusters ─────────────────────────────────────────────────────
export const CLUSTERS = {
  yBlock: { name: "Y Block, Phase 3", center: [31.4757, 74.3807] as [number, number] },
  phase5: { name: "CCA, Phase 5", center: [31.4633, 74.4098] as [number, number] },
  phase6: { name: "Main Boulevard, Phase 6", center: [31.4752, 74.4460] as [number, number] },
};

export const ZONE = { name: "DHA Lahore", polygon: DEFAULT_ZONE };

// ─── Restaurants ─────────────────────────────────────────────────────────────
export const RESTAURANTS: SeedRestaurant[] = [
  {
    slug: "tikka-taiyaar",
    name: "Tikka Taiyaar",
    tagline: "Koylay pe seedha, plate pe fatafat",
    cuisines: ["BBQ", "Tikka"],
    cluster: "yBlock",
    offsetM: [40, -60],
    emoji: "🍢",
    gradient: ["#F08A24", "#6B230B"],
    rating: 4.7,
    ratingCount: 1284,
    priceLevel: 2,
    hours: ["12:00", "03:00"],
    staffName: "Tikka Taiyaar Kitchen",
    menu: [
      {
        section: "From the koyla",
        items: [
          { name: "Chicken Tikka (Leg)", price: 590, prep: 10, emoji: "🍗", popular: true, desc: "Charcoal-grilled, house masala, lemon.", options: [addOns([opt("Extra raita", 80), opt("Salad", 100), opt("Naan", 60)])] },
          { name: "Chicken Tikka (Chest)", price: 620, prep: 10, emoji: "🍗", options: [addOns([opt("Extra raita", 80), opt("Salad", 100), opt("Naan", 60)])] },
          { name: "Malai Boti (10 pcs)", price: 1150, prep: 11, emoji: "🍢", popular: true, desc: "Creamy, mild, melts in the mouth." },
          { name: "Chicken Seekh Kabab (4)", price: 890, prep: 9, emoji: "🍢" },
          { name: "Beef Seekh Kabab (4)", price: 990, prep: 9, emoji: "🍢" },
          { name: "Reshmi Kabab (4)", price: 950, prep: 10, emoji: "🍢" },
          { name: "Bihari Boti", price: 1050, prep: 11, emoji: "🔥" },
          { name: "Mutton Chops (4)", price: 2400, prep: 22, emoji: "🥩", desc: "Slow — not in the 30-min fast lane." },
        ],
      },
      {
        section: "Naan & sides",
        items: [
          { name: "Tandoori Naan", price: 60, prep: 3, emoji: "🫓" },
          { name: "Roghni Naan", price: 110, prep: 4, emoji: "🫓" },
          { name: "Garlic Naan", price: 150, prep: 4, emoji: "🧄" },
          { name: "Raita", price: 120, prep: 1, emoji: "🥣" },
          { name: "Kachumber Salad", price: 150, prep: 2, emoji: "🥗" },
          { name: "Soft Drink 1.5L", price: 280, prep: 1, emoji: "🥤" },
        ],
      },
    ],
  },
  {
    slug: "degh-and-dum",
    name: "Degh & Dum",
    tagline: "Seedha degh se — no waiting",
    cuisines: ["Biryani", "Pulao"],
    cluster: "phase5",
    offsetM: [30, 50],
    emoji: "🍛",
    gradient: ["#F5A30A", "#7A3A0B"],
    rating: 4.6,
    ratingCount: 2210,
    priceLevel: 1,
    hours: ["11:00", "02:00"],
    staffName: "Degh & Dum Counter",
    menu: [
      {
        section: "Biryani",
        items: [
          { name: "Chicken Biryani", price: 450, prep: 5, emoji: "🍛", popular: true, desc: "Basmati, aloo, the proper masala.", options: [halfFull(350), addOns([opt("Extra raita", 80), opt("Shami kabab", 130), opt("Boiled egg", 60)])] },
          { name: "Beef Biryani", price: 520, prep: 5, emoji: "🍛", options: [halfFull(380), addOns([opt("Extra raita", 80), opt("Shami kabab", 130)])] },
          { name: "Sindhi Biryani", price: 550, prep: 5, emoji: "🌶️", options: [halfFull(400)] },
          { name: "Mutton Biryani", price: 950, prep: 5, emoji: "🍛", options: [halfFull(800)] },
          { name: "Chicken Pulao", price: 480, prep: 5, emoji: "🍚", options: [halfFull(350)] },
        ],
      },
      {
        section: "On the side",
        items: [
          { name: "Shami Kabab (2)", price: 260, prep: 3, emoji: "🥙" },
          { name: "Raita", price: 100, prep: 1, emoji: "🥣" },
          { name: "Salad", price: 120, prep: 1, emoji: "🥗" },
          { name: "Zarda", price: 280, prep: 2, emoji: "🍚" },
          { name: "Kheer", price: 300, prep: 1, emoji: "🍮" },
          { name: "Soft Drink 1.5L", price: 280, prep: 1, emoji: "🥤" },
        ],
      },
    ],
  },
  {
    slug: "smash-scene",
    name: "Smash Scene",
    tagline: "Crispy edges. Zero wait.",
    cuisines: ["Burgers"],
    cluster: "yBlock",
    offsetM: [-50, 30],
    emoji: "🍔",
    gradient: ["#FFB020", "#8A2B0E"],
    rating: 4.8,
    ratingCount: 3120,
    priceLevel: 3,
    hours: ["12:00", "03:00"],
    staffName: "Smash Scene Grill",
    menu: [
      {
        section: "Smash burgers",
        items: [
          { name: "Classic Smash", price: 890, prep: 8, emoji: "🍔", popular: true, desc: "Two thin patties, cheese, house sauce.", options: [pickOne("Patties", [opt("Single"), opt("Double", 400)]), addOns([opt("Extra cheese", 120), opt("Jalapeños", 80), opt("Caramelised onions", 100)])] },
          { name: "Jalapeño Smash", price: 990, prep: 8, emoji: "🌶️", options: [pickOne("Patties", [opt("Single"), opt("Double", 400)])] },
          { name: "Mushroom Swiss", price: 1090, prep: 9, emoji: "🍄" },
          { name: "Smoked Beef Stack", price: 1250, prep: 10, emoji: "🍔" },
        ],
      },
      {
        section: "Chicken",
        items: [
          { name: "Crispy Chicken Burger", price: 850, prep: 9, emoji: "🍗", options: [addOns([opt("Extra cheese", 120), opt("Make it a meal (fries + drink)", 450)])] },
          { name: "Nashville Hot", price: 990, prep: 10, emoji: "🔥", popular: true },
          { name: "Chicken Tenders (4)", price: 790, prep: 9, emoji: "🍗" },
        ],
      },
      {
        section: "Sides & shakes",
        items: [
          { name: "Loaded Fries", price: 690, prep: 7, emoji: "🍟" },
          { name: "Fries", price: 390, prep: 5, emoji: "🍟" },
          { name: "Oreo Shake", price: 750, prep: 3, emoji: "🥤" },
          { name: "Soft Drink Can", price: 180, prep: 1, emoji: "🥤" },
        ],
      },
    ],
  },
  {
    slug: "crust-theory",
    name: "Crust Theory",
    tagline: "Stone-oven pizza in 90 seconds flat",
    cuisines: ["Pizza"],
    cluster: "phase6",
    offsetM: [60, 20],
    emoji: "🍕",
    gradient: ["#E8590C", "#5C1A0B"],
    rating: 4.5,
    ratingCount: 1840,
    priceLevel: 3,
    hours: ["12:00", "02:00"],
    staffName: "Crust Theory Oven",
    menu: [
      {
        section: "Pizza",
        items: [
          { name: "Margherita", price: 950, prep: 11, emoji: "🍕", options: [pickOne("Size", [opt("Small 7\""), opt("Medium 10\"", 700), opt("Large 13\"", 1400)]), addOns([opt("Extra cheese", 250)])] },
          { name: "Chicken Tikka Pizza", price: 1150, prep: 12, emoji: "🍕", popular: true, options: [pickOne("Size", [opt("Small 7\""), opt("Medium 10\"", 800), opt("Large 13\"", 1500)]), addOns([opt("Extra cheese", 250)])] },
          { name: "Chicken Fajita", price: 1150, prep: 12, emoji: "🌶️", options: [pickOne("Size", [opt("Small 7\""), opt("Medium 10\"", 800), opt("Large 13\"", 1500)])] },
          { name: "Beef Pepperoni", price: 1250, prep: 11, emoji: "🍕", options: [pickOne("Size", [opt("Small 7\""), opt("Medium 10\"", 850), opt("Large 13\"", 1600)])] },
          { name: "Veggie Supreme", price: 1050, prep: 11, emoji: "🫑", options: [pickOne("Size", [opt("Small 7\""), opt("Medium 10\"", 700), opt("Large 13\"", 1400)])] },
        ],
      },
      {
        section: "Sides",
        items: [
          { name: "Garlic Bread", price: 450, prep: 7, emoji: "🥖" },
          { name: "Cheesy Sticks", price: 650, prep: 8, emoji: "🧀" },
          { name: "Oven Wings (6)", price: 850, prep: 10, emoji: "🍗" },
          { name: "Molten Lava Cake", price: 550, prep: 4, emoji: "🍫" },
          { name: "Soft Drink 1.5L", price: 280, prep: 1, emoji: "🥤" },
        ],
      },
    ],
  },
  {
    slug: "broast-bros",
    name: "Broast Bros",
    tagline: "Pressure-fried, pressure-free",
    cuisines: ["Broast", "Fried Chicken"],
    cluster: "phase5",
    offsetM: [-40, -70],
    emoji: "🍗",
    gradient: ["#F2A541", "#6E2C0E"],
    rating: 4.4,
    ratingCount: 960,
    priceLevel: 2,
    hours: ["12:00", "02:00"],
    staffName: "Broast Bros Fryer",
    menu: [
      {
        section: "Broast",
        items: [
          { name: "Quarter Broast", price: 750, prep: 11, emoji: "🍗", popular: true, desc: "With fries, bun and garlic mayo.", options: [pickOne("Piece", [opt("Leg"), opt("Chest", 50)]), addOns([opt("Extra garlic mayo", 60), opt("Coleslaw", 150)])] },
          { name: "Half Broast", price: 1350, prep: 12, emoji: "🍗" },
          { name: "Full Broast", price: 2550, prep: 12, emoji: "🍗" },
          { name: "Broast Burger", price: 650, prep: 9, emoji: "🍔" },
          { name: "Chicken Strips (6)", price: 890, prep: 9, emoji: "🍗" },
        ],
      },
      {
        section: "Sides",
        items: [
          { name: "Fries", price: 350, prep: 5, emoji: "🍟" },
          { name: "Coleslaw", price: 150, prep: 1, emoji: "🥗" },
          { name: "Garlic Mayo Dip", price: 100, prep: 1, emoji: "🧄" },
          { name: "Soft Drink 1.5L", price: 280, prep: 1, emoji: "🥤" },
        ],
      },
    ],
  },
  {
    slug: "wrap-wala",
    name: "Wrap Wala",
    tagline: "Shawarma jo ruk ke khaana pare",
    cuisines: ["Shawarma", "Arabic"],
    cluster: "phase6",
    offsetM: [-30, -60],
    emoji: "🌯",
    gradient: ["#F59F00", "#7A3E07"],
    rating: 4.6,
    ratingCount: 1502,
    priceLevel: 1,
    hours: ["12:00", "03:00"],
    staffName: "Wrap Wala Counter",
    menu: [
      {
        section: "Shawarma",
        items: [
          { name: "Chicken Shawarma", price: 450, prep: 6, emoji: "🌯", popular: true, options: [pickOne("Size", [opt("Regular"), opt("Jumbo", 200)]), addOns([opt("Extra garlic sauce", 60), opt("Cheese", 100), opt("Fries inside", 100)])] },
          { name: "Zinger Shawarma", price: 590, prep: 8, emoji: "🌯" },
          { name: "Beef Shawarma", price: 650, prep: 6, emoji: "🌯" },
          { name: "Shawarma Platter", price: 1150, prep: 8, emoji: "🍽️", desc: "Sliced chicken, rice, fries, garlic sauce, pita." },
          { name: "Falafel Wrap", price: 490, prep: 7, emoji: "🧆" },
        ],
      },
      {
        section: "Sides & drinks",
        items: [
          { name: "Hummus & Pita", price: 550, prep: 3, emoji: "🫓" },
          { name: "Fries", price: 350, prep: 5, emoji: "🍟" },
          { name: "Mint Margarita", price: 450, prep: 3, emoji: "🍹" },
        ],
      },
    ],
  },
  {
    slug: "dragon-dhaba",
    name: "Dragon Dhaba",
    tagline: "Lahori-Chinese, wok-fast",
    cuisines: ["Chinese", "Pakistani-Chinese"],
    cluster: "yBlock",
    offsetM: [90, 80],
    emoji: "🥡",
    gradient: ["#E8590C", "#4A1606"],
    rating: 4.5,
    ratingCount: 1377,
    priceLevel: 2,
    hours: ["12:00", "01:00"],
    staffName: "Dragon Dhaba Wok",
    menu: [
      {
        section: "Mains",
        items: [
          { name: "Manchurian + Fried Rice", price: 1190, prep: 11, emoji: "🥡", popular: true, options: [pickOne("Rice", [opt("Egg fried rice"), opt("Chicken fried rice", 150)]), pickOne("Spice", [opt("Mild"), opt("Medium"), opt("Hot")])] },
          { name: "Chicken Chilli Dry", price: 1150, prep: 10, emoji: "🌶️", options: [pickOne("Spice", [opt("Mild"), opt("Medium"), opt("Hot")])] },
          { name: "Kung Pao Chicken", price: 1190, prep: 11, emoji: "🥜" },
          { name: "Chicken Chowmein", price: 990, prep: 10, emoji: "🍜" },
          { name: "Szechuan Beef", price: 1350, prep: 12, emoji: "🥩" },
          { name: "Egg Fried Rice", price: 690, prep: 7, emoji: "🍚" },
        ],
      },
      {
        section: "Soups & starters",
        items: [
          { name: "Chicken Corn Soup", price: 420, prep: 5, emoji: "🥣" },
          { name: "Hot & Sour Soup", price: 450, prep: 5, emoji: "🥣" },
          { name: "Spring Rolls (4)", price: 590, prep: 8, emoji: "🥟" },
          { name: "Dynamite Prawns", price: 1650, prep: 10, emoji: "🍤" },
        ],
      },
    ],
  },
  {
    slug: "sufi-nihari",
    name: "Sufi Nihari House",
    tagline: "Raat bhar pakti hai, minton mein aati hai",
    cuisines: ["Nihari", "Desi"],
    cluster: "phase5",
    offsetM: [110, -20],
    emoji: "🥘",
    gradient: ["#C2410C", "#3B1204"],
    rating: 4.8,
    ratingCount: 2688,
    priceLevel: 2,
    hours: ["07:00", "01:00"],
    staffName: "Sufi Nihari Degh",
    menu: [
      {
        section: "Nihari & more",
        items: [
          { name: "Beef Nihari", price: 890, prep: 4, emoji: "🥘", popular: true, desc: "Slow-cooked overnight. Ginger, chillies, lemon on the side.", options: [pickOne("Portion", [opt("Single"), opt("Double", 700)]), addOns([opt("Nalli", 450), opt("Maghaz", 500)])] },
          { name: "Nalli Nihari", price: 1350, prep: 4, emoji: "🦴" },
          { name: "Maghaz Nihari", price: 1450, prep: 4, emoji: "🥘" },
          { name: "Paye", price: 950, prep: 4, emoji: "🍲" },
          { name: "Haleem", price: 650, prep: 4, emoji: "🥣" },
        ],
      },
      {
        section: "Roti & drinks",
        items: [
          { name: "Khameeri Roti", price: 70, prep: 3, emoji: "🫓" },
          { name: "Kulcha", price: 90, prep: 3, emoji: "🫓" },
          { name: "Lassi", price: 350, prep: 3, emoji: "🥛", options: [pickOne("Style", [opt("Sweet"), opt("Salty")])] },
          { name: "Kheer", price: 300, prep: 1, emoji: "🍮" },
        ],
      },
    ],
  },
  {
    slug: "subah-savera",
    name: "Subah Savera",
    tagline: "Halwa puri, Lahori style",
    cuisines: ["Breakfast", "Halwa Puri"],
    cluster: "phase6",
    offsetM: [20, 110],
    emoji: "🥞",
    gradient: ["#FAB005", "#8C4A07"],
    rating: 4.7,
    ratingCount: 1990,
    priceLevel: 1,
    hours: ["06:00", "14:00"],
    staffName: "Subah Savera Tawa",
    menu: [
      {
        section: "Nashta",
        items: [
          { name: "Halwa Puri Platter", price: 490, prep: 6, emoji: "🥞", popular: true, desc: "2 puri, suji halwa, cholay, aloo.", options: [addOns([opt("Extra puri", 70), opt("Extra halwa", 150)])] },
          { name: "Nan Chanay", price: 350, prep: 5, emoji: "🫓" },
          { name: "Paratha + Omelette", price: 450, prep: 8, emoji: "🍳" },
          { name: "Cholay Plate", price: 320, prep: 3, emoji: "🥣" },
          { name: "Aloo Bhujia", price: 280, prep: 3, emoji: "🥔" },
          { name: "Family Nashta (4)", price: 1850, prep: 10, emoji: "👨‍👩‍👧‍👦" },
        ],
      },
      {
        section: "Meetha & chai",
        items: [
          { name: "Suji Halwa (250g)", price: 380, prep: 2, emoji: "🍯" },
          { name: "Lassi", price: 320, prep: 3, emoji: "🥛", options: [pickOne("Style", [opt("Sweet"), opt("Salty")])] },
          { name: "Doodh Patti", price: 150, prep: 4, emoji: "🫖" },
        ],
      },
    ],
  },
  {
    slug: "chai-chowk",
    name: "Chai Chowk",
    tagline: "Chai 24/7. Paratha jab dil kare.",
    cuisines: ["Chai", "Paratha"],
    cluster: "yBlock",
    offsetM: [-100, -30],
    emoji: "🫖",
    gradient: ["#D9480F", "#3D1A0A"],
    rating: 4.6,
    ratingCount: 4102,
    priceLevel: 1,
    hours: ["00:00", "00:00"],
    staffName: "Chai Chowk Stall",
    menu: [
      {
        section: "Chai",
        items: [
          { name: "Doodh Patti", price: 150, prep: 4, emoji: "🫖", popular: true, options: [pickOne("Sugar", [opt("Normal"), opt("Less"), opt("None")]), pickOne("Size", [opt("Cup"), opt("Kettle (4 cups)", 350)])] },
          { name: "Kashmiri Chai", price: 280, prep: 5, emoji: "🫖" },
          { name: "Karak Chai", price: 200, prep: 5, emoji: "🫖" },
        ],
      },
      {
        section: "Paratha & snacks",
        items: [
          { name: "Aloo Paratha", price: 280, prep: 8, emoji: "🫓" },
          { name: "Qeema Paratha", price: 450, prep: 10, emoji: "🫓" },
          { name: "Lachha Paratha", price: 180, prep: 7, emoji: "🫓" },
          { name: "Nutella Paratha", price: 490, prep: 8, emoji: "🍫" },
          { name: "Anda Paratha Roll", price: 350, prep: 8, emoji: "🌯" },
          { name: "Bun Kabab", price: 320, prep: 6, emoji: "🍔" },
          { name: "Samosa (2)", price: 160, prep: 3, emoji: "🥟" },
        ],
      },
    ],
  },
  {
    slug: "meetha-mahal",
    name: "Meetha Mahal",
    tagline: "Kuch meetha ho jaye?",
    cuisines: ["Desserts"],
    cluster: "phase5",
    offsetM: [-80, 90],
    emoji: "🍮",
    gradient: ["#F59F00", "#6B3A05"],
    rating: 4.7,
    ratingCount: 870,
    priceLevel: 2,
    hours: ["11:00", "02:00"],
    staffName: "Meetha Mahal Counter",
    menu: [
      {
        section: "Desi mithai",
        items: [
          { name: "Gulab Jamun (4)", price: 360, prep: 2, emoji: "🟤", popular: true },
          { name: "Rasmalai (2)", price: 420, prep: 2, emoji: "🥛" },
          { name: "Gajar Halwa", price: 520, prep: 3, emoji: "🥕" },
          { name: "Kheer", price: 320, prep: 2, emoji: "🍮" },
          { name: "Shahi Tukray", price: 480, prep: 3, emoji: "🍞" },
          { name: "Rabri", price: 450, prep: 2, emoji: "🥣" },
          { name: "Jalebi (250g)", price: 350, prep: 5, emoji: "🍥" },
        ],
      },
      {
        section: "Modern",
        items: [
          { name: "Kulfi Falooda", price: 550, prep: 4, emoji: "🍨" },
          { name: "Molten Brownie", price: 590, prep: 4, emoji: "🍫", options: [addOns([opt("Vanilla scoop", 200)])] },
          { name: "Cheesecake Slice", price: 690, prep: 2, emoji: "🍰" },
        ],
      },
    ],
  },
  {
    slug: "roast-republic",
    name: "Roast Republic",
    tagline: "Specialty coffee, DHA speed",
    cuisines: ["Coffee", "Bakery"],
    cluster: "phase6",
    offsetM: [-90, 40],
    emoji: "☕",
    gradient: ["#A0522D", "#2B1409"],
    rating: 4.5,
    ratingCount: 1133,
    priceLevel: 3,
    hours: ["08:00", "01:00"],
    staffName: "Roast Republic Bar",
    menu: [
      {
        section: "Coffee",
        items: [
          { name: "Spanish Latte", price: 790, prep: 4, emoji: "☕", popular: true, options: [pickOne("Size", [opt("Regular"), opt("Large", 150)]), pickOne("Milk", [opt("Full cream"), opt("Oat", 200), opt("Almond", 200)]), addOns([opt("Extra shot", 150)])] },
          { name: "Cappuccino", price: 690, prep: 4, emoji: "☕", options: [pickOne("Size", [opt("Regular"), opt("Large", 150)])] },
          { name: "Americano", price: 550, prep: 3, emoji: "☕" },
          { name: "Espresso", price: 450, prep: 3, emoji: "☕" },
          { name: "Iced Latte", price: 790, prep: 4, emoji: "🧊" },
          { name: "Caramel Macchiato", price: 850, prep: 4, emoji: "☕" },
          { name: "Mocha", price: 820, prep: 4, emoji: "☕" },
          { name: "Cold Brew", price: 750, prep: 2, emoji: "🧊" },
          { name: "Matcha Latte", price: 890, prep: 4, emoji: "🍵" },
        ],
      },
      {
        section: "Bakery",
        items: [
          { name: "Butter Croissant", price: 450, prep: 3, emoji: "🥐" },
          { name: "Chicken & Cheese Croissant", price: 750, prep: 6, emoji: "🥐" },
          { name: "Chocolate Chip Cookie", price: 290, prep: 1, emoji: "🍪" },
        ],
      },
    ],
  },
  {
    slug: "seekh-and-roll",
    name: "Seekh & Roll",
    tagline: "Paratha rolls, Lahore ka pyaar",
    cuisines: ["Rolls", "BBQ"],
    cluster: "yBlock",
    offsetM: [10, 140],
    emoji: "🥙",
    gradient: ["#F76707", "#5A1E06"],
    rating: 4.4,
    ratingCount: 760,
    priceLevel: 1,
    hours: ["13:00", "03:00"],
    staffName: "Seekh & Roll Tawa",
    menu: [
      {
        section: "Rolls",
        items: [
          { name: "Chicken Chatni Roll", price: 390, prep: 7, emoji: "🥙", popular: true, options: [pickOne("Paratha", [opt("Regular"), opt("Lachha", 50)]), pickOne("Spice", [opt("Normal"), opt("Extra hot")])] },
          { name: "Mayo Garlic Roll", price: 420, prep: 7, emoji: "🥙" },
          { name: "Beef Seekh Roll", price: 480, prep: 8, emoji: "🥙" },
          { name: "Malai Boti Roll", price: 520, prep: 8, emoji: "🥙" },
          { name: "Zinger Roll", price: 550, prep: 9, emoji: "🥙" },
          { name: "Cheese Chicken Roll", price: 520, prep: 8, emoji: "🧀" },
          { name: "Double Chicken Roll", price: 650, prep: 8, emoji: "🥙" },
        ],
      },
      {
        section: "Extras",
        items: [
          { name: "Fries", price: 300, prep: 5, emoji: "🍟" },
          { name: "Mint Raita Dip", price: 80, prep: 1, emoji: "🥣" },
          { name: "Soft Drink Can", price: 180, prep: 1, emoji: "🥤" },
        ],
      },
    ],
  },
  {
    slug: "kabuli-and-co",
    name: "Kabuli & Co.",
    tagline: "Pulao, chapli, qehwa",
    cuisines: ["Afghani", "Pulao"],
    cluster: "phase5",
    offsetM: [60, 150],
    emoji: "🍚",
    gradient: ["#E67700", "#4D2A06"],
    rating: 4.5,
    ratingCount: 640,
    priceLevel: 2,
    hours: ["12:00", "00:00"],
    staffName: "Kabuli & Co. Kitchen",
    menu: [
      {
        section: "Pulao & kabab",
        items: [
          { name: "Kabuli Pulao (Chicken)", price: 790, prep: 5, emoji: "🍚", popular: true, desc: "Carrots, raisins, tender chicken." },
          { name: "Kabuli Pulao (Beef)", price: 890, prep: 5, emoji: "🍚" },
          { name: "Yakhni Pulao", price: 590, prep: 5, emoji: "🍚" },
          { name: "Chapli Kabab", price: 390, prep: 8, emoji: "🥩" },
          { name: "Chapli Burger", price: 590, prep: 9, emoji: "🍔" },
          { name: "Afghani Tikka", price: 1150, prep: 12, emoji: "🍢" },
          { name: "Namkeen Gosht", price: 1950, prep: 25, emoji: "🥩", desc: "Slow — not in the 30-min fast lane." },
        ],
      },
      {
        section: "Sides",
        items: [
          { name: "Kabuli Naan", price: 90, prep: 3, emoji: "🫓" },
          { name: "Qehwa", price: 200, prep: 3, emoji: "🍵" },
          { name: "Raita", price: 100, prep: 1, emoji: "🥣" },
          { name: "Salad", price: 120, prep: 1, emoji: "🥗" },
        ],
      },
    ],
  },
  {
    slug: "loaded-lab",
    name: "Loaded Lab",
    tagline: "Fries, wings, zero chill",
    cuisines: ["Fries", "Wings"],
    cluster: "phase6",
    offsetM: [130, -40],
    emoji: "🍟",
    gradient: ["#FD7E14", "#5C2405"],
    rating: 4.3,
    ratingCount: 580,
    priceLevel: 2,
    hours: ["14:00", "03:00"],
    staffName: "Loaded Lab Fryer",
    menu: [
      {
        section: "Loaded",
        items: [
          { name: "Classic Loaded Fries", price: 690, prep: 7, emoji: "🍟", popular: true, options: [addOns([opt("Jalapeños", 80), opt("Extra cheese sauce", 150)])] },
          { name: "Pizza Fries", price: 790, prep: 8, emoji: "🍕" },
          { name: "Nacho Fries", price: 790, prep: 8, emoji: "🌮" },
          { name: "Mac & Cheese Bowl", price: 950, prep: 8, emoji: "🧀" },
        ],
      },
      {
        section: "Wings & bites",
        items: [
          { name: "Buffalo Wings", price: 850, prep: 10, emoji: "🍗", options: [pickOne("Count", [opt("6 pcs"), opt("12 pcs", 750)])] },
          { name: "Honey Garlic Wings", price: 890, prep: 10, emoji: "🍯" },
          { name: "Dynamite Bites", price: 890, prep: 9, emoji: "💥" },
          { name: "Mozzarella Sticks (6)", price: 750, prep: 7, emoji: "🧀" },
        ],
      },
      {
        section: "Drinks",
        items: [
          { name: "Mint Lemonade", price: 390, prep: 2, emoji: "🍋" },
          { name: "Brownie Shake", price: 790, prep: 3, emoji: "🥤" },
        ],
      },
    ],
  },
];

// ─── People ──────────────────────────────────────────────────────────────────
// Phone numbers are fake test numbers. Password comes from SEED_PASSWORD.
export const ADMIN = { phone: "+923000000001", name: "Ops Admin" };

export const CUSTOMERS = [
  {
    phone: "+923000000101",
    name: "Hassan",
    address: { label: "Home", phase: "Phase 3", block: "Y", house_no: "142", street: "Street 5", lat: 31.479, lng: 74.386, gate_note_kind: "guard" as const, gate_note: "Guard will receive" },
  },
  {
    phone: "+923000000102",
    name: "Ayesha",
    address: { label: "Home", phase: "Phase 5", block: "E", house_no: "58", street: null, lat: 31.458, lng: 74.415, gate_note_kind: "bell" as const, gate_note: "Ring the bell, black gate" },
  },
  {
    phone: "+923000000103",
    name: "Zara",
    address: { label: "Home", phase: "Phase 6", block: "C", house_no: "311", street: null, lat: 31.4705, lng: 74.452, gate_note_kind: "call" as const, gate_note: "Call on arrival" },
  },
];

export const RIDERS = [
  { phone: "+923000000201", name: "Bilal Ahmed", vehicle: "Honda CD-70", plate: "LEA-1234", start: CLUSTERS.yBlock.center },
  { phone: "+923000000202", name: "Usman Tariq", vehicle: "Honda CD-70", plate: "LEB-5521", start: CLUSTERS.phase5.center },
  { phone: "+923000000203", name: "Hamza Iqbal", vehicle: "Yamaha YBR", plate: "LEC-7788", start: CLUSTERS.phase6.center },
  { phone: "+923000000204", name: "Waqas Ali", vehicle: "Suzuki GD-110", plate: "LED-4410", start: [31.4700, 74.3990] as [number, number] },
  { phone: "+923000000205", name: "Faisal Mehmood", vehicle: "Honda 125", plate: "LEE-9090", start: [31.4680, 74.4300] as [number, number] },
];

/** Restaurant staff logins: +9230000003NN in RESTAURANTS order. */
export const restaurantStaffPhone = (index: number) => `+9230000003${String(index + 1).padStart(2, "0")}`;
