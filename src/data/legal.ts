/**
 * Legal / policy pages (required by Razorpay for activation, and good practice for any online shop).
 * Plain-language drafts based on how the site actually works. The shop owners should read them once and
 * edit anything that is not how they want to operate (every rule below is in one place: this file).
 */

export type LegalBlock = { h: string; p?: string[]; ul?: string[] };
export type LegalDoc = { slug: string; title: string; accent: string; sub: string; description: string; blocks: LegalBlock[] };

export const LEGAL_UPDATED = '16 October 2026';

export const CONTACT_LINE = 'Misal Hub, Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, near Gayatri Dham, Mira Road East, Mira Bhayandar, Maharashtra 401107. Phone / WhatsApp +91 90041 67448. Email misalhub@gmail.com.';

export const LEGAL: LegalDoc[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy', accent: 'Policy',
    sub: 'What we collect, why, and how we protect it',
    description: 'How Misal Hub collects, uses and protects your personal information when you order online or apply for a franchise.',
    blocks: [
      { h: 'Who we are', p: ['This website is run by Misal Hub, a Maharashtrian Misal Pav restaurant in Mira Road East, serving since 2015. In this policy “we”, “us” and “our” mean Misal Hub.'] },
      { h: 'What we collect', ul: [
        'When you order: your name, mobile number, email address (optional), delivery address, the location of your address (or your phone’s location if you tap “Use my current location”), your order and any notes you type.',
        'When you apply for a franchise: your name, phone, email, city, preferred call date and time, and your message.',
        'Payment: payments are handled by Razorpay. We never see or store your card, UPI PIN or bank details. We receive only a payment confirmation and payment id.',
        'Basic technical data such as your browser type and pages visited, to keep the site working and secure.',
      ] },
      { h: 'Why we use it', ul: [
        'To prepare, deliver and confirm your order, and to call you if there is a problem with it.',
        'To work out the delivery distance and charge.',
        'To respond to franchise enquiries.',
        'To prevent fraud and misuse of the site, and to meet legal and accounting requirements.',
      ] },
      { h: 'Who we share it with', p: ['We do not sell your information. We share it only with the services needed to run the shop:'], ul: [
        'Razorpay (payment processing).',
        'Google (our order and enquiry records are kept in Google Sheets and confirmation emails are sent through Google; address and distance look-ups use Google or OpenStreetMap-based map services).',
        'Our own staff and delivery riders, who see your name, phone and address only for your order.',
        'Authorities, when the law requires it.',
      ] },
      { h: 'How long we keep it', p: ['We keep order records for as long as needed for accounting, tax and dispute purposes (generally up to 7 years). Franchise enquiries are kept for as long as the conversation is active, and you can ask us to delete yours at any time.'] },
      { h: 'How we protect it', p: ['Payments and prices are verified on our servers. Our records are in access-controlled accounts with two-step verification, and the website connection is encrypted (HTTPS). No system is perfectly secure, but we take reasonable care.'] },
      { h: 'Your choices and rights', p: ['You can ask us to show, correct or delete the personal information we hold about you, or to stop contacting you, by calling or emailing us at the details below. We will act on genuine requests within a reasonable time, subject to records we must keep by law.'] },
      { h: 'Cookies and storage', p: ['The site stores your cart and the details you choose to remember (name, phone, address) in your own browser so you do not have to retype them. You can clear this at any time from your browser settings. We do not run advertising trackers.'] },
      { h: 'Children', p: ['This website is not directed at children under 18, and we do not knowingly collect their information.'] },
      { h: 'Changes', p: ['We may update this policy. The date at the top shows when it was last changed.'] },
      { h: 'Contact', p: [CONTACT_LINE] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms &', accent: 'Conditions',
    sub: 'The rules for ordering and using this website',
    description: 'Terms and conditions for ordering from Misal Hub online: prices, payment, delivery, allergies and use of the website.',
    blocks: [
      { h: 'About these terms', p: ['By using this website or placing an order you agree to these terms. If you do not agree, please do not use the site; you are always welcome to order by phone or visit us.'] },
      { h: 'Orders', ul: [
        'Online orders are accepted every day from 8:00 AM to 8:00 PM (India time).',
        'An order is confirmed only after your payment succeeds and you see the confirmation screen / receive our message.',
        'We may cancel or refuse an order if an item is unavailable, the address is outside our delivery area, or we suspect misuse. If we cancel after you have paid, you will be refunded in full.',
      ] },
      { h: 'Prices and payment', ul: [
        'All prices are in Indian rupees (₹) and are shown on the Menu page. The delivery charge, if any, is shown before you pay. No other charge is added at payment.',
        'Payment is online only (UPI, cards, net banking, wallets) through Razorpay. We do not accept cash on delivery.',
        'We may change menu items and prices at any time; the price you see when you pay is the price you are charged.',
      ] },
      { h: 'Delivery', p: ['Delivery areas, charges and timing are explained in our Delivery Policy. Please give a complete and correct address and keep your phone reachable.'] },
      { h: 'Cancellations and refunds', p: ['Our Cancellation & Refund Policy explains when you can cancel and how refunds work.'] },
      { h: 'Food, allergies and Jain options', ul: [
        'Our food is prepared in a kitchen that handles gluten, dairy, nuts, sesame, onion and garlic. If you have a serious allergy, please call us before ordering.',
        'Jain items are prepared without onion and garlic. Please tell us about any other dietary need in the order notes or by phone.',
        'Photos are for illustration; real portions and presentation may vary slightly.',
      ] },
      { h: 'Franchise enquiries', p: ['Submitting the franchise form is only an enquiry. It does not create any franchise, partnership or promise of one. Any franchise is offered only through a separate written agreement.'] },
      { h: 'Using the website', ul: [
        'Please do not misuse the site, attempt to break or overload it, or place false orders.',
        'The text, logo and original photographs belong to Misal Hub. Some dish photographs are credited on the Photo credits page.',
      ] },
      { h: 'Liability', p: ['We take care to run the site and kitchen well, but the website is provided “as is”. To the extent allowed by law, our liability for any order is limited to the amount you paid for that order.'] },
      { h: 'Governing law', p: ['These terms are governed by the laws of India. Disputes fall under the courts in Thane, Maharashtra.'] },
      { h: 'Contact', p: [CONTACT_LINE] },
    ],
  },
  {
    slug: 'refund-policy',
    title: 'Cancellation &', accent: 'Refund Policy',
    sub: 'When you can cancel and how refunds work',
    description: 'Misal Hub cancellation and refund policy for online orders: cancelling an order, missing or wrong items, and how long refunds take.',
    blocks: [
      { h: 'Cancelling an order', ul: [
        'Food is made fresh, so please call or WhatsApp us on +91 90041 67448 within 5 minutes of placing the order. If we have not started preparing it, we will cancel it and refund you in full.',
        'Once an order is being prepared or is out for delivery, it cannot be cancelled.',
        'If we cancel your order (for example, an item is unavailable or your address cannot be reached), you will get a full refund.',
      ] },
      { h: 'Problems with your order', p: ['If something is wrong, contact us within 1 hour of delivery with your order reference (it looks like MH261016-XXXX) and, where possible, a photo.'], ul: [
        'Missing or wrong item: we will send the correct item or refund its price.',
        'Food spilled, spoiled or not as described: we will replace the item or refund it, after a quick look at the photo.',
        'Order not delivered at all: full refund.',
        'We cannot refund for change of mind after the food has been prepared, or for taste preferences, but please tell us — we want to put it right.',
      ] },
      { h: 'Failed or double payments', p: ['If money is deducted but your order is not confirmed, or you were charged twice, it will be refunded to you automatically by your bank/Razorpay, usually within 5 to 7 working days. If not, send us the payment id and we will follow it up.'] },
      { h: 'How refunds are paid', p: ['Refunds go back to the original payment method (the same UPI, card or bank account you paid with). After we approve a refund it usually reaches you in 5 to 7 working days, depending on your bank. We cannot refund in cash.'] },
      { h: 'Contact', p: [CONTACT_LINE] },
    ],
  },
  {
    slug: 'delivery-policy',
    title: 'Delivery', accent: 'Policy',
    sub: 'Where we deliver, what it costs and how long it takes',
    description: 'Misal Hub delivery policy for Mira Road and Bhayandar: delivery area up to 5 km, delivery charges and timings.',
    blocks: [
      { h: 'Delivery area', p: ['We deliver from our shop in Mira Road East up to 5 km by road. You can check your address on the Menu page before paying; if it is outside the area, the site will tell you. You can also choose Pickup and collect from the shop.'] },
      { h: 'Delivery charges', ul: [
        '₹50 for addresses up to 1 km from our shop.',
        '₹80 for addresses beyond 1 km, up to 5 km.',
        'The exact charge is shown before you pay.',
        'Distance is measured by road from our shop to your address.',
      ] },
      { h: 'Timings', ul: [
        'Orders are accepted from 8:00 AM to 8:00 PM, every day (India time).',
        'On some days we may pause delivery or pickup (for example when the shop is closed). The website then shows that clearly and does not take orders for that option.',
        'Delivery usually takes about 30 to 45 minutes, depending on distance, weather, traffic and how busy we are. This is an estimate, not a guarantee.',
      ] },
      { h: 'Your part', ul: [
        'Give a complete address with flat/house number, building and a nearby landmark, and keep your phone on so the rider can reach you.',
        'If we cannot reach you or find the address after reasonable attempts, we may return the order; in that case it cannot be refunded because the food is already prepared.',
      ] },
      { h: 'Pickup', p: ['Choose Pickup at checkout, pay online, and collect your order from the shop at Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, Mira Road East. There is no delivery charge for pickup.'] },
      { h: 'Contact', p: [CONTACT_LINE] },
    ],
  },
];

export const legalBySlug = (slug: string) => LEGAL.find((d) => d.slug === slug);
