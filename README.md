# Scruples

**Exploring art - from the old masters to the magic button.**

Scruples is a small interactive story told on a hand-drawn puppet stage. You tear a ticket, the curtains open, and you follow Zhenya, a marionette doll who loves art, through its scenes: a gallery of famous paintings, a tiny souvenir shop, art on social media, meeting Daphne (a doll who'd rather draw than press a "magic button"), drawing something yourself, and a final moment in the spotlight.

Everything is drawn by hand, and it's meant to be like a box theater. Art and animations are made in Procreate (Voice over coming soon...)

## The story

| Page | Scene                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Meet Zhenya** - say "Hi" to a marionette doll                                                                                           |
| 2    | **Zhenya likes art** - a slowly scrolling gallery of famous paintings; click one to read about it                                         |
| 3    | **Souvenir shop** - spend your $15 on button pins, Micron pens, a notebook… or the Mona Lisa                                              |
| 4    | **Art on social media** - an endless feed of artists' posts                                                                               |
| 5    | **Meet Daphne** - the magic button makes a drawing instantly; Daphne draws one by hand, and explains why                                  |
| 6    | **Every artist starts somewhere** - you draw in a frame on the stage                                                                      |
| 7    | **The art competition** - fill in the entry form, then choose: submit the magic button's painting, or your own                            |
| 8    | **The results** - win with one click and hear from everyone who worked for weeks, or lose to a magic button and talk about how that feels |
| 9    | **In the spotlight** - "Magic Button is Horrible!" … "But why?"                                                                           |

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
- Procreate for art

## Images

The images the site uses are in `public/imgs`, by what they are:

| Folder | What's in it |
| --- | --- |
| `stage/` | Curtains, the ticket, the menu, the paper backgrounds, popsicle sticks, and the frame-by-frame curtain and ticket animations |
| `zhenya/` | Zhenya's poses and animations |
| `daphne/` | Daphne's poses and her palette |
| `art/` | The famous paintings' frames and the drawings |
| `shop/` | Everything in the souvenir shop, and the notebook |
| `hats/` | The mystery box hats |
| `social/` | The social media posts |

The full-size originals they were made from (GIFs and big PNGs) are in `art-sources/`, outside `public/`, so they aren't sent to visitors.

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

## Screenshots

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 19 13 AM" src="https://github.com/user-attachments/assets/b892f060-6cf8-4f95-ae6c-7d39627ddb86" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 19 31 AM" src="https://github.com/user-attachments/assets/ef683478-f4d2-44c4-8e72-b411fb3add6c" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 19 45 AM" src="https://github.com/user-attachments/assets/3b0f2479-c1e2-492c-bb0d-72bf5ac24390" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 20 03 AM" src="https://github.com/user-attachments/assets/513f99f5-941e-4b31-b8ec-ea939382d39d" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 20 21 AM" src="https://github.com/user-attachments/assets/9d5a513e-8ade-4619-82e7-2b2e37969a28" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 21 00 AM" src="https://github.com/user-attachments/assets/bc578ae6-81d6-4610-b5e7-2b4c76431625" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 21 22 AM" src="https://github.com/user-attachments/assets/b4ffe10e-7175-496c-8c43-53811bb911b4" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 21 34 AM" src="https://github.com/user-attachments/assets/46d278de-8445-4b3a-97a3-bfe126eae7a3" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 22 03 AM" src="https://github.com/user-attachments/assets/39f5946a-04bf-4db6-8631-831ad3d8d152" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 22 44 AM" src="https://github.com/user-attachments/assets/7982d19f-b0a0-4368-a08d-800e61778a5b" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 23 28 AM" src="https://github.com/user-attachments/assets/eb30dd96-c869-4117-a97c-1661e4136d9c" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 23 54 AM" src="https://github.com/user-attachments/assets/18672bb8-e469-4704-b1d8-a18f93de5776" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 24 19 AM" src="https://github.com/user-attachments/assets/ea2373a6-989f-4d29-9fef-c70d2522f86a" />

<img width="1710" height="950" alt="Screenshot 2026-10-13 at 1 25 21 AM" src="https://github.com/user-attachments/assets/76d7eaa2-6dfa-4a87-ab8a-52f15521272a" />
