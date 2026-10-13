# Scruples

**Exploring art - from the old masters to the magic button.**

Scruples is a small interactive story told on a hand-drawn puppet stage. You tear a ticket, the curtains open, and you follow Zhenya, a marionette doll who loves art, through seven scenes: a gallery of famous paintings, a tiny souvenir shop, art on social media, meeting Daphne (a doll who'd rather draw than press a "magic button"), drawing something yourself, and a final moment in the spotlight.

Everything is drawn by hand, hangs on strings or stands on popsicle sticks, and moves like a real puppet theatre.

## Screenshots

<!-- Add your screenshots here, e.g.
![The ticket and closed curtains](screenshots/ticket.png)
![Zhenya and the gallery marquee](screenshots/gallery.png)
-->

## The story

| Page | Scene |
| --- | --- |
| 1 | **Meet Zhenya** - say "Hi" to a marionette doll |
| 2 | **Zhenya likes art** - a slowly scrolling gallery of famous paintings; click one to read about it |
| 3 | **Souvenir shop** - spend your $15 on button pins, Micron pens, a notebook… or the Mona Lisa |
| 4 | **Art on social media** - an endless feed of artists' posts |
| 5 | **Meet Daphne** - the magic button makes a drawing instantly; Daphne draws one by hand, and explains why |
| 6 | **Every artist starts somewhere** - you draw in a frame on the stage |
| 7 | **In the spotlight** - "Magic Button is Horrible!" … "But why?" |

## Features

- **A real stage** - a ticket that rips, curtains that open and close between pages, labels and buttons that hang on strings (and give a little tug when clicked), things that rise in on popsicle sticks
- **Inventory** - money that carries between pages, things you buy or are given, selling items back, and money that's really in your pocket on screen
- **Drawing** - draw on the stage in four colors, make the frame bigger, and your drawing is framed and kept in your inventory
- **A notebook** - buy it in the shop, then open it from the inventory: ten pages, a bookmark, and your drawings are saved in your browser
- **Painting pages** - each painting in the gallery has its own page with details and fun facts
- **Sound** - a quiet lullaby, curtain swishes, the ticket ripping, labels landing and thunder, all made live in the browser with the Web Audio API (no audio files), with an on/off button
- **Works on phones** - its own layout for phones held upright
- **Accessible** - keyboard focus outlines, screen-reader labels, and reduced motion respected

## Built with

- [Next.js](https://nextjs.org) 16 (App Router) and React 19
- [Tailwind CSS](https://tailwindcss.com) 4
- TypeScript
- The Web Audio API for sound, and canvas for the curtain animations and drawing
- The hand-drawn Scribbler font

## Running it locally

```bash
npm install
```

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To build and run the production version:

```bash
npm run build
```

```bash
npm start
```

## Project layout

```
app/            Routes: /page1 … /page7, /art-piece/[slug], sitemap, robots, manifest
components/     The stage (curtains, menu, inventory) and each page's scene
  Stage.tsx       Curtains, ticket, "?" menu, inventory, sound button
  Page1-7.tsx     The seven scenes
  ArtPiece.tsx    A painting's own page
  Notebook.tsx    The drawable notebook
lib/
  frames.ts       The gallery paintings, their details and fun facts
  shop.ts         Everything that can be bought, and prices
  sound.ts        All the sounds and the background music
  stroke.ts       Smooth pen strokes for drawing
public/imgs/    The hand-drawn art, curtain frames and animations
```
