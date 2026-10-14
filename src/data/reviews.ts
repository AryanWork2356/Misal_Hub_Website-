/* ============================================================
   GOOGLE REVIEWS
   Paste real reviews from your Google Business Profile here.
   Only genuine reviews — the home page shows exactly what is in this list.
   While the list is empty, the site shows just the rating and a
   "Read our reviews on Google" button.

   { name: 'Reviewer name', stars: 5, text: 'Review text…', when: '2 months ago' }
   ============================================================ */

export const GOOGLE = {
  rating: 4.4,
  // Your Google listing share link (the "Read our reviews on Google" button opens this)
  url: 'https://share.google/HT5LTVopPIO8QiDLd'
};

export type Review = { name: string; stars: number; text: string; when?: string };
export const REVIEWS: Review[] = [
  // { name: '', stars: 5, text: '', when: '' },
];

