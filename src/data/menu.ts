export type Item = {
  id: string;
  name: string;
  /** regular price (INR); null = seasonal / ask in store */
  p: number | null;
  /** Jain price; property absent = not on the Jain menu */
  j?: number | null;
  /** note shown on the Jain menu instead of `note` */
  jn?: string;
  note?: string;
  /** file in /public/images/menu (without .jpg) */
  img?: string;
};
export type Category = { id: string; name: string; blurb: string; items: Item[] };
/* ============================================================
   MISAL HUB — MENU DATA  (source: "Misal hub new menu (3).pdf")
   Edit prices / items here; the Menu page and Home page read this.

   item fields
     id     unique key
     name   display name
     p      regular price (INR)  — null = seasonal / ask in store (not orderable)
     j      Jain price (INR)     — omit if the item is not on the Jain menu
     jn     Jain note (replaces `note` in Jain mode)
     note   short description / what is included
     img    file in images/menu/ (without .jpg). If the file is missing the card
            falls back to a plain tile, so you can add photos at any time.
   ============================================================ */

export const MENU: Category[] = [
  { id: 'misal', name: 'Misal Pav', blurb: 'The heart of Misal Hub.', items: [
    { id: 'misal-pav',        name: 'Misal Pav',            p: 90,  j: 115, img: 'misal-pav',  note: 'Classic misal with farsan, onion and pav.' },
    { id: 'only-misal', img: 'only-misal',       name: 'Only Misal',           p: 85,  j: 110, note: 'Misal bowl without pav.' },
    { id: 'dahi-misal-pav', img: 'dahi-misal-pav',   name: 'Dahi Misal Pav',       p: 110, j: 130, note: 'Misal topped with cooling dahi.' },
    { id: 'vada-misal-pav',   name: 'Vada Misal Pav',       p: 110, img: 'vada-misal-pav', note: 'Crispy batata vada dunked in misal.' },
    { id: 'only-vada-misal', img: 'only-vada-misal',  name: 'Only Vada Misal',      p: 105, note: 'Vada misal without pav.' },
    { id: 'cheese-misal-pav', img: 'cheese-misal-pav', name: 'Cheese Misal Pav',     p: 130, j: 165, note: 'Loaded with melted cheese.' },
    { id: 'fry-misal-pav',    name: 'Fry Misal Pav',        p: 120, j: 155, img: 'fry-misal-pav', note: 'Tawa-fried misal, extra crispy.' },
    { id: 'only-fry-misal', img: 'only-fry-misal',   name: 'Only Fry Misal',       p: 110, j: 150, note: 'Fry misal without pav.' },
    { id: 'cheese-fry-misal', img: 'cheese-fry-misal', name: 'Cheese Fry Misal Pav', p: 160, j: 195, note: 'Fry misal with melted cheese.' },
    { id: 'nikahara-misal-pav', name: 'Nikahara Misal Pav', p: 125, j: 150, img: 'nikahara-misal-pav', note: 'Drier, intense style served in a clay pot.' },
    { id: 'sizzling-fry-misal', name: 'Sizzling Fry Misal Pav', p: 240, note: 'Served sizzling hot on a tawa plate.' }
  ]},
  { id: 'usal', name: 'Usal Pav', blurb: 'Sprouted matki usal, the comfort classic.', items: [
    { id: 'usal-pav', img: 'usal-pav',      name: 'Usal Pav',      p: 85,  j: 110, note: 'Matki usal with buttered pav.' },
    { id: 'only-usal', img: 'only-usal',     name: 'Only Usal',     p: 80,  j: 105, note: 'Usal bowl without pav.' },
    { id: 'vada-usal-pav', img: 'vada-usal-pav', name: 'Vada Usal Pav', p: 100, note: 'Usal with crispy batata vada and pav.' }
  ]},
  { id: 'chulha', name: 'Chulha Misal', blurb: 'A feast for the whole table.', items: [
    { id: 'chulha-misal', name: 'Chulha Misal (Group of 4)', p: 850,
      note: '4 Misal, 15 Pav, 4 Batata Vada, 1 plate Mix Bhajiya, 4 Gulab Jamun, 2 Dahi, 2 Chaas, 2 Kokum Sarbat.' }
  ]},
  { id: 'thali', name: 'Thali', blurb: 'The complete Misal Hub spread.', items: [
    { id: 'misal-thali', name: 'Misal Thali', p: 170, j: 200, img: 'misal-thali',
      note: 'Curry Rasa, Misal, Farsan, Aloo Sabji, Tarri, Dahi, Papad, Salad, 4 Pav, Chaas, Sweet.',
      jn:   'Curry Rasa, Misal, Farsan, Moongdal Bhajiya, Tarri, Dahi, Papad, Salad, 4 Pav, Chaas, Sweet.' },
    { id: 'nikhara-misal-thali', name: 'Nikhara Misal Thali', p: 200, j: 230, img: 'nikahara-misal-thali',
      note: 'Curry Rasa, Misal, Farsan, Aloo Sabji, Tarri, Dahi, Papad, Salad, 4 Pav, Chaas, Sweet.',
      jn:   'Curry Rasa, Misal, Farsan, Moongdal Bhajiya, Tarri, Dahi, Papad, Achar, Salad, 4 Pav, Chaas, Sweet.' },
    { id: 'fry-misal-thali', img: 'fry-misal-thali', name: 'Fry Misal Thali', p: 220, j: 240,
      note: 'Curry Rasa, Misal, Farsan, Tarri, Papad, Salad, 4 Butter Pav, Chaas, Sweet.' }
  ]},
  { id: 'combo', name: 'Combos', blurb: 'More food, better value.', items: [
    { id: 'misal-pav-combo', name: 'Misal Pav Combo', p: 135, j: 150, note: 'Misal Pav + Chaas + 1 Ltr Mineral Water.' },
    { id: 'misal-fry-combo', name: 'Misal Pav & Fry Misal Pav Combo', p: 255, j: 305, note: 'Misal Pav + Fry Misal Pav + 1 Chaas + 1 Ltr Mineral Water.' },
    { id: 'vada-usal-combo', name: 'Vada Usal Pav Combo', p: 365, note: 'Vada Usal Pav + Misal Pav + Chole Puri + 4 Puri + 4 Pav + 1 Ltr Mineral Water.' },
    { id: 'nikahara-combo',  name: 'Nikahara Misal Pav Combo', p: 290, j: 340, note: 'Nikahara Misal Pav + Fry Misal Pav + 4 Pav + 1 Chaas.' }
  ]},
  { id: 'snacks', name: 'Snacks', blurb: 'Quick bites, any hour.', items: [
    { id: 'masala-papad', img: 'masala-papad',   name: 'Masala Papad',   p: 70 },
    { id: 'samosa-pav', img: 'samosa-pav',     name: 'Samosa Pav',     p: 25 },
    { id: 'samosa-2', img: 'samosa-2',       name: 'Samosa (2 Pc)',  p: 40 },
    { id: 'kanda-bhajiya', img: 'kanda-bhajiya',  name: 'Kanda Bhajiya',  p: 100 },
    { id: 'batata-bhajiya', img: 'batata-bhajiya', name: 'Batata Bhajiya', p: 100 },
    { id: 'mix-bhajiya', img: 'mix-bhajiya',    name: 'Mix Bhajiya',    p: 140 },
    { id: 'moongdal-bhajiya', img: 'moongdal-bhajiya', name: 'Moongdal Bhajiya', p: 120 },
    { id: 'bread-cutlet', img: 'bread-cutlet',   name: 'Bread Cutlet',   p: 30 },
    { id: 'sabudana-vada',  name: 'Sabudana Vada',  p: 70, img: 'sabudana-vada' },
    { id: 'sabudana-khichdi', img: 'sabudana-khichdi', name: 'Sabudana Khichdi', p: 80, j: 80 },
    { id: 'kande-pohe', img: 'kande-pohe',     name: 'Kande Pohe',     p: 70, j: 80, jn: 'Poha (Jain).' },
    { id: 'upma', img: 'upma',           name: 'Upma',           p: 70, j: 80 },
    { id: 'aloo-paratha', img: 'aloo-paratha',   name: 'Aloo Paratha with Curd (2 Pc)', p: 150 },
    { id: 'moong-dal-bhaji', img: 'moong-dal-bhaji', name: 'Moong Dal Bhaji', p: 90, j: 90 },
    { id: 'paneer-bhurji', img: 'paneer-bhurji',  name: 'Paneer Bhurji (2 Pav)', p: 170 }
  ]},
  { id: 'vadapav', name: 'Vada Pav', blurb: "Mumbai's street classic.", items: [
    { id: 'vada-pav', img: 'vada-pav',        name: 'Vada Pav',        p: 25 },
    { id: 'cheese-grill-vp', img: 'cheese-grill-vp', name: 'Cheese Grill Vada Pav', p: 65 },
    { id: 'mayo-vada-pav', img: 'mayo-vada-pav',   name: 'Mayonnaise Vada Pav', p: 35 },
    { id: 'tandoori-vada-pav', img: 'tandoori-vada-pav', name: 'Tandoori Vada Pav', p: 40 },
    { id: 'loaded-cheese-vp', img: 'loaded-cheese-vp', name: 'Loaded Cheese Grill Vada Pav', p: 75 },
    { id: 'batata-vada-2', img: 'batata-vada-2',   name: 'Batata Vada (2 Pc)', p: 40 }
  ]},
  { id: 'puri', name: 'Chole Puri / Puri Bhaji', blurb: 'Traditional favourites.', items: [
    { id: 'chole-puri', img: 'chole-puri', name: 'Chole Puri',   p: 110, j: 120 },
    { id: 'puri-5', img: 'puri-5',     name: 'Puri (5 Pcs)', p: 45,  j: 45 },
    { id: 'puri-bhaji', img: 'puri-bhaji', name: 'Puri Bhaji',   p: 90 },
    { id: 'aamras-puri', name: 'Aamras Puri', p: null, j: null, note: 'Seasonal — ask in store.' }
  ]},
  { id: 'sandwich', name: 'Sandwich', blurb: 'Grilled, pressed, loaded.', items: [
    { id: 'sada-sandwich', img: 'sada-sandwich',     name: 'Sada Sandwich',            p: 80,  j: 80 },
    { id: 'veg-grill', img: 'veg-grill',         name: 'Veg Grill Sandwich',       p: 120, j: 130 },
    { id: 'veg-cheese-grill', img: 'veg-cheese-grill',  name: 'Veg Cheese Grill Sandwich', p: 160, j: 170 },
    { id: 'masala-grill', img: 'masala-grill',      name: 'Masala Grill Sandwich',    p: 145 },
    { id: 'masala-cheese-grill', img: 'masala-cheese-grill', name: 'Masala Cheese Grill Sandwich', p: 180 },
    { id: 'loaded-sandwich', img: 'loaded-sandwich',   name: 'Loaded Sandwich',          p: 199 },
    { id: 'cheese-chilly-grill', img: 'cheese-chilly-grill', name: 'Cheese Chilly Grill Sandwich', p: 170, j: 190 },
    { id: 'tandoori-mayo-grill', img: 'tandoori-mayo-grill', name: 'Tandoori Mayo Cheese Grill Sandwich', p: 190 }
  ]},
  { id: 'beverages', name: 'Beverages', blurb: 'The perfect companions.', items: [
    { id: 'kulhad-tea', img: 'kulhad-tea',    name: 'Kulhad Tea',            p: 25 },
    { id: 'kulhad-coffee', img: 'kulhad-coffee', name: 'Kulhad Nescafe Coffee', p: 45 },
    { id: 'chaas', img: 'chaas',         name: 'Chaas',                 p: 30 },
    { id: 'water', img: 'water',         name: 'Mineral Water 1 Ltr',   p: 20 },
    { id: 'cold-drink', img: 'cold-drink',    name: 'Cold Drink',            p: 20 },
    { id: 'kokam-soda', img: 'kokam-soda',    name: 'Kokam Soda',            p: 80 },
    { id: 'kokam-sarbat', img: 'kokam-sarbat',  name: 'Kokam Sarbat',          p: 60 },
    { id: 'solkadhi', img: 'solkadhi',      name: 'Solkadhi',              p: 60 },
    { id: 'aamras-vati',   name: 'Aamras Vati',           p: null, note: 'Seasonal — ask in store.' },
    { id: 'aamras-500',    name: 'Aamras (500 gm)',       p: null, note: 'Seasonal — ask in store.' }
  ]},
  { id: 'extras', name: 'Extras', blurb: 'Add what you love.', items: [
    { id: 'x-pav',        name: 'Pav',          p: 5 },
    { id: 'x-butter-pav', name: 'Butter Pav',   p: 20 },
    { id: 'x-farsan', img: 'x-farsan',     name: 'Farsan',       p: 15 },
    { id: 'x-papad', img: 'x-papad',      name: 'Papad',        p: 10 },
    { id: 'x-cheese', img: 'x-cheese',     name: 'Cheese',       p: 35 },
    { id: 'x-dahi', img: 'x-dahi',       name: 'Dahi',         p: 25 },
    { id: 'x-gulab-jamun', img: 'x-gulab-jamun', name: 'Gulab Jamun', p: 20 },
    { id: 'x-rassa-vati', name: 'Rassa Vati',   p: 25 }
  ]}
];

/* Best sellers shown on the Home page (ids from above) */
export const BESTSELLERS: string[] = ['misal-pav', 'fry-misal-pav', 'nikahara-misal-pav', 'vada-misal-pav', 'misal-thali', 'nikhara-misal-thali'];

