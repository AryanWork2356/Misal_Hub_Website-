/* ============================================================
   GOOGLE REVIEWS
   Real reviews come automatically from Google once GOOGLE_MAPS_API_KEY + GOOGLE_PLACE_ID are set (docs/SETUP.md).
   Until then you can paste real ones into REVIEWS below.

   SAMPLE REVIEWS are PLACEHOLDERS (invented text and names) used only so you can preview the layout.
   They show on the site with a visible "sample" label. Before launch set SHOW_SAMPLE_REVIEWS = false.

   { name: 'Reviewer name', stars: 5, text: 'Review text…', when: '2 months ago' }
   ============================================================ */

export const GOOGLE = {
  rating: 4.4,
  // Your Google listing share link (the "Read our reviews on Google" button opens this)
  url: 'https://share.google/HT5LTVopPIO8QiDLd'
};

export type Review = { name: string; stars: number; text: string; when?: string };

/** Real reviews you paste in by hand (leave empty if you use the Google API). */
export const REVIEWS: Review[] = [
  // { name: '', stars: 5, text: '', when: '' },
];

/** Layout preview only — NOT real customer reviews. Turn off before launch. */
export const SHOW_SAMPLE_REVIEWS = true;
export const SAMPLE_REVIEWS: Review[] = [
  { name: 'Sample Reviewer A', stars: 5, when: '2 weeks ago', text: 'The misal has real depth of flavour, and the tari on the side lets you pick your own heat. Pav was soft and buttery. Easily my go-to for breakfast.' },
  { name: 'Sample Reviewer B', stars: 5, when: '1 month ago', text: 'Ordered the Misal Thali for the whole family. Generous portions, everything was piping hot and the sweet at the end was a lovely touch.' },
  { name: 'Sample Reviewer C', stars: 4, when: '1 month ago', text: 'Fry Misal is crunchy and addictive. A bit busy on weekend mornings but the team moves fast and stays friendly.' },
  { name: 'Sample Reviewer D', stars: 5, when: '2 months ago', text: 'Kulhad chai with a plate of kanda bhajiya on a rainy evening — perfect. Clean place and reasonable prices.' },
  { name: 'Sample Reviewer E', stars: 5, when: '3 months ago', text: 'Loved the Jain options; it is rare to find misal made without onion and garlic that still tastes this good.' },
  { name: 'Sample Reviewer F', stars: 4, when: '4 months ago', text: 'Vada Misal Pav is a great combination. Would love a few more seating options, but the food more than makes up for it.' },
];
