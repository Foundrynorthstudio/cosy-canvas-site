export type JournalCategory = 'guides' | 'weddings' | 'tips' | 'seasonal' | 'gear';
export type JournalStatus = 'published' | 'draft';

export const CATEGORY_LABELS: Record<JournalCategory, string> = {
  guides: 'Glamping Guides',
  weddings: 'Wedding Spotlights',
  tips: 'Camping Tips',
  seasonal: 'Seasonal',
  gear: 'Gear & Kit',
};

export const DEFAULT_AUTHOR = {
  name: 'The Cosy Canvas Co.',
  role: 'Scottish Bell Tent Specialists',
};

export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: JournalCategory;
  categoryName: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  date: string;
  isoDate: string;
  updatedIso?: string;
  readTime: string;
  featured: boolean;
  status: JournalStatus;
  image: string;
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || `story-${Date.now()}`;
}

export function estimateReadTime(markdown: string): string {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

export function formatJournalDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function wordCount(markdown: string): number {
  return markdown.trim().split(/\s+/).filter(Boolean).length;
}

export const SEED_POSTS: JournalPost[] = [
  {
    slug: "red-squirrel-campsite-glencoe",
    title: "Field notes from Red Squirrel: a Friday night in Glen Coe",
    excerpt: "Full 5G, a picnic-table office, and cooking by the fire. Red Squirrel is my logistics base for a RatRace hire north of Fort William — then Gemini renders of the dream fleet before bed.",
    category: "guides",
    categoryName: "Glamping Guides",
    author: {
      name: "Jeremie",
      role: "Notes from the pitch",
    },
    date: "11 September 2026",
    isoDate: "2026-09-11T21:30:00Z",
    readTime: "8 min read",
    featured: false,
    status: "published",
    image: "/campsite_red_squirrel.jpg",
    imageAlt: "Night pitch at Red Squirrel Campsite: two-person tent, stove, and picnic table under the Glen Coe trees",
    seoTitle: "Red Squirrel Campsite Glencoe: Friday Field Notes",
    seoDescription: "Friday night at Red Squirrel in Glen Coe: 5G as a logistics base, fire cooking, a RatRace hire north of Fort William, and Gemini renders of the Cosy Canvas fleet.",
    keywords: "red squirrel campsite glencoe, glencoe camping, ratrace fort william camping, vw caddy maxi, audi a4 wrap, camperking scotland, a82 glencoe drive",
    content: `
I am writing this from a picnic bench at **Red Squirrel Campsite** in Glen Coe, lamp on, stove going, laptop open. Day job: office manager at CamperKing Scotland — Barry’s number one, if you ask him. We are both camping people and both petrolheads, which is a dangerous combination and also the whole point.

Tonight is a Cosy Canvas recce wrapped around a customer job. I am here a couple of nights as a base, because tomorrow I head just north of Fort William to pitch a hire for a **RatRace** weekend. One of the mattresses might have a puncture. Fort William shops, first thing.

---

## The drive

The run north was in the wife’s **Audi A4 Quattro DSG Black Edition**. It is a dream on this road. Power when you want it, four-wheel grip when the A82 gets greasy, comfy enough after a full day in the office, punchy when a gap opens. If I am being greedy — and I am — it could do with a set of all-terrain tyres and smaller rims. We can argue about that another night.

<div class="photo-pair">
<figure>
<img src="/glencoe-red-squirrel/drive-a82.jpg" alt="Dusk on the A82 heading into the Highlands, mountains ahead">
<figcaption>Dusk on the A82. From the Polmont side this is about two hours if you do not hang about.</figcaption>
</figure>
<figure>
<img src="/glencoe-red-squirrel/drive-viaduct.jpg" alt="Glenfinnan railway viaduct on the hillside from the car">
<figcaption>Glenfinnan from the windscreen. Proper Highland miles. Not a Central Belt overnighter.</figcaption>
</figure>
</div>

---

## Two minutes to spare

I rolled in right on closing. The chap on the desk was brilliant — friendly, unfussed, still had time for a late Friday arrival after what was clearly a long day. I know that feeling from CamperKing when the yard is full and the phone will not sit still. Proper Highland hospitality.

Then I drove the whole site. First time round. A couple of awkward five- and six-point reverses in the dark, trees where you did not want them, pitches already claimed. Found a spot in the end. Grabbed a picnic bench. That is the whole job, really: keep circling until the ground makes sense.

<figure>
<img src="/glencoe-red-squirrel/pitch-night.jpg" alt="Two-person tent, stove and picnic table lit at night in woodland at Red Squirrel Campsite">
<figcaption>The pitch. Woodland, bench, stove, tent up. Friday-night busy, but this clearing was enough.</figcaption>
</figure>

---

## The tent I actually love

I put up the **Decathlon two-man pop-up**. I absolutely love this tent. Up in two minutes. No guy-line ballet, no headtorch faff. On a night like this, that is the difference between being a nuisance in the car park and sitting down with a cuppa.

For Cosy Canvas guests the honest note still stands. Red Squirrel is excellent for two people. On a busy Friday I would not have got a **4M bell tent** down easily. The flat, usable clearings go first. Guy lines need room. Come up in daylight, walk the site, and take a pitch while there is still space to stake. Midweek, or a daytime deluxe run from Polmont, is how you do canvas here properly.

<div class="photo-pair">
<figure>
<img src="/glencoe-red-squirrel/tent-and-stove.jpg" alt="Decathlon two-man pop-up tent with the door open and a stove burning">
<figcaption>Decathlon 2-man, door open, stove lit. Two minutes from bag to bed-shaped.</figcaption>
</figure>
<figure>
<img src="/glencoe-red-squirrel/stove-close.jpg" alt="Close-up of a camping stove with a highland midge on the rim">
<figcaption>A midge on the rim for authenticity. River woodland in September is still river woodland.</figcaption>
</figure>
</div>

---

## Tomorrow: RatRace, north of Fort William

This stay is the staging post. Customer rental, RatRace experience, camp to build just north of Fort William in the morning. If that mattress is punctured I will be in town hunting a replacement before anyone is asking why their bed is a paddling pool.

That is the work. Hire kit has to be right on the hill, not almost right.

<figure>
<img src="/glencoe-red-squirrel/picnic-table.jpg" alt="Picnic table, lamp and laptop beside the tent and stove at Red Squirrel">
<figcaption>Picnic-table office. Cosy Canvas site on one tab, tomorrow’s kit list on the other. Full 5G. Not a detox.</figcaption>
</figure>

---

## Why it is on our map

* **Best for:** Two people, a simple tent, or a 4M bell tent if you arrive in daylight — or a logistics overnighter with a laptop and a stove
* **OS grid:** NN 105 577
* **Drive:** about 2 hours / 110 miles from Polmont via the A82
* **Book:** [redsquirrelcampsite.co.uk](https://redsquirrelcampsite.co.uk/)

Red Squirrel has been camping ground since 1914. It is Glen Coe with a shower block, not a holiday park. Full signal, friendly late check-in, and a picnic table that works as a desk. That is why it earns a pin on the [campsites](/campsites) page.

---

## Not a digital detox

People talk about Glen Coe like you come here to switch off. Fair enough if that is the brief. It is not mine tonight.

There is **full 5G** on this pitch. Laptop is fine. Maps are fine. Studio tools are fine. For me, Red Squirrel is the perfect **logistics base** — close enough to tomorrow’s RatRace job, wild enough that you remember why the canvas is worth dragging north, connected enough that you can actually run the business from a picnic table.

Then you close the lid and cook by the fire.

Paul — founder of Foundry North Studio — calls cooking with a fire what coding with AI is for him. Same headspace. Hands busy, brain sorting the next move, something good coming together if you do not rush it. I get that. Tonight the stove is the compiler.

---

## Dream fleet, rendered before bed

I finished the night in Gemini, playing with the contour graphic on the vehicles I actually want to be driving on jobs like this.

First up: the wife’s **A4**, wrapped. Contour lines, triangle mark, still a Black Edition underneath. Then the greedy spec — roof rack, steels, the all-terrain look I keep threatening her with.

<div class="photo-pair photo-pair--portrait">
<figure>
<img src="/glencoe-red-squirrel/a4-wrap.jpg" alt="Audi A4 wrapped in Cosy Canvas contour graphics parked in Glen Coe with bell tents behind">
<figcaption>The A4 Quattro in Cosy Canvas wrap. Still her car. Just louder about it.</figcaption>
</figure>
<figure>
<img src="/glencoe-red-squirrel/a4-wrap-swamper.jpg" alt="Wrapped Audi A4 with roof rack and black steel wheels in Glen Coe">
<figcaption>Same wrap, my version: rack, steels, a bit of swamper. We can argue about the rims another night.</figcaption>
</figure>
</div>

Then the new gift from **Barry** at CamperKing. I am actually very grateful. It is a **2016 VW Touran**, 178,000 miles, moon-miles, dog-shit example of the breed, and it smells awful. The boot, though — huge. For a staging run with kit, mattresses, and a pop-up, that matters more than the perfume.

<figure>
<img src="/glencoe-red-squirrel/touran-barry.jpg" alt="Black VW Touran with Cosy Canvas wrap, CamperKing plate and roof rack in Glen Coe">
<figcaption>Barry’s moon-miles Touran, Gemini-spec. ND63 KDU energy. Grateful. The boot is the feature.</figcaption>
</figure>

The actual dream logistics vehicle is a **LWB Caddy Maxi**. Probably white — they usually are trades vans, and at CKS we already know how to make a white van look mint with the **CKS treatment**: gloss black wheels, gloss-pack bumper and grille insert. For this one I would go swamper — black wheel-arch trims and a cargo roof system. Doors open, bell tents in the background, Highland road still in the legs.

<div class="photo-pair">
<figure>
<img src="/glencoe-red-squirrel/caddy-maxi-white.jpg" alt="White VW Caddy Maxi with Cosy Canvas graphics, gloss black wheels and roof cargo, doors open beside bell tents">
<figcaption>White LWB Caddy Maxi. Trades van, CKS treatment, doors open on the job.</figcaption>
</figure>
<figure>
<img src="/glencoe-red-squirrel/caddy-maxi-black.jpg" alt="Black VW Caddy Maxi with Cosy Canvas contour wrap and loaded roof, Glen Coe behind">
<figcaption>Or all-black. Same rack, same load-out. I could live with either.</figcaption>
</figure>
</div>

I love driving the Highland roads in Scotland. That is a huge part of why I am doing this. The canvas is the product. The A82 is the reason it does not feel like a spreadsheet company.

This is tonight, from the bench. Tomorrow is Fort William.
    `,
  },
  {
    slug: "top-10-campsites-scotland",
    title: "Top 10 Hidden Gem Campsites in Scotland for 2026/2027",
    excerpt: "Discover our handpicked selection of breathtaking Scottish pitch locations, from coastal headlands in Mull to sheltered oak woodlands beside Loch Lomond.",
    category: "guides",
    categoryName: "Glamping Guides",
    author: {
      name: "Callum Fraser",
      role: "Lead Pitch Logistics & Scotland Guide",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    date: "August 12, 2026",
    isoDate: "2026-08-12T10:00:00Z",
    readTime: "6 min read",
    featured: true,
    status: "published",
    image: "/campsite_cobleland.jpg",
    imageAlt: "Luxury bell tent pitched under ancient oak canopy at Cobleland campsite Scotland",
    seoTitle: "Top 10 Hidden Gem Campsites in Scotland (2026/2027 Guide)",
    seoDescription: "Discover the 10 best scenic pitch locations across Scotland for bell tent glamping. Featuring Loch Lomond, Isle of Mull, Cairngorms, and NC500 spots.",
    keywords: "best campsites scotland, glamping loch lomond, hidden gem campsites scotland, bell tent locations scotland, camping places 2026",
    content: `
## Why Choosing the Right Scottish Pitch Matters

Scotland is blessed with some of Europe's most dramatic landscapes, but every glen and coastline offers a distinctly different camping experience. Whether you're seeking sheltered ancient oak woodlands, white shell-sand beaches, or mountain views reflecting across glassy lochs, choosing the ideal campsite is the foundation of an unforgettable stay.

When booking with **The Cosy Canvas Co.**, our logistics team delivers and pitches your heavy-duty canvas palace directly on your reserved pitch. Here are our top 10 recommended campsites across Scotland for the 2026/2027 season.

---

### 1. Cobleland Campsite (Loch Lomond & The Trossachs)
* **Location:** Near Aberfoyle, Stirlingshire (OS Grid: NN 531 002)
* **Best For:** Woodland tranquility, river walks, campfire pits, and family glamping.
* **Why We Love It:** Tucked inside the Queen Elizabeth Forest Park on the banks of the River Forth, Cobleland offers peaceful grass pitches shaded by grand oak trees. It's only 40 minutes from our Polmont base depot, making setup seamless.

### 2. Fidden Farm (Isle of Mull, Inner Hebrides)
* **Location:** Fionnphort, Isle of Mull
* **Best For:** White sands, turquoise Atlantic waters, and Iona ferry day trips.
* **Why We Love It:** One of Scotland's most iconic coastal campsites. Pitch right on the machair grass overlooking pink granite tidal skerries and watch seals playing in the bay while your stove warms the canvas.

### 3. Sallochy Campsite (East Shore, Loch Lomond)
* **Location:** Near Rowardennan, Loch Lomond
* **Best For:** Direct shoreline loch access, West Highland Way proximity, and designated fire pits.
* **Why We Love It:** Sallochy is a semi-wild Forestry and Land Scotland site with exclusive loch-side pitches. Ideal for paddleboarding right from your tent door.

### 4. Durness Sango Sands Oasis (North Coast 500)
* **Location:** Durness, Sutherland
* **Best For:** Dramatic clifftop panoramas and viewing the Northern Lights.
* **Why We Love It:** Perched high above golden sand beaches with sweeping Atlantic views. On clear autumn nights, this is one of the premier Dark Sky spots in Europe.

---

## What to Check Before You Book

> [!TIP]
> **Pitch Size Requirement:** Our 4M bell tents require a minimum 6m × 6m flat grass footprint including guy ropes. For 5M tents, ensure your pitch is at least 7m × 7m. For our 6M Cathedral tent, reserve an 8m × 8m pitch.

1. **Fire Regulations:** Always verify whether your campsite permits off-ground fire pits. All our fire pits and stoves include heatproof hearth mats.
2. **Access Road:** Ensure vehicle access is available within 30 meters of your pitch for our pitching team's equipment trolley.
3. **Midgie Season Planning:** May to August can have midgie hatches near still lochs; we recommend pitching on breezy headlands or selecting our built-in secondary mesh door tent tier.
    `
  },
  {
    slug: "outdoor-wedding-village-guide",
    title: "How to Plan a Luxury Bell Tent Wedding Village on Private Land",
    excerpt: "Everything you need to know about estate power requirements, guest check-in logistics, bridal suites, and spatial planning for outdoor wedding accommodation.",
    category: "weddings",
    categoryName: "Wedding Spotlights",
    author: {
      name: "Kirsty MacLeod",
      role: "Event & Wedding Canvas Coordinator",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
    },
    date: "July 28, 2026",
    isoDate: "2026-07-28T10:00:00Z",
    readTime: "8 min read",
    featured: false,
    status: "published",
    image: "/blog_wedding_canvas_village.jpg",
    imageAlt: "Bespoke bridal bell tent village lit with festoon lighting on private Scottish estate",
    seoTitle: "How to Plan a Bell Tent Wedding Village in Scotland",
    seoDescription: "Step-by-step guide to hosting a luxury bell tent glamping village for your Scottish wedding. Covers estate layout, power, bridal suites, and guest booking.",
    keywords: "bell tent wedding scotland, outdoor wedding accommodation scotland, glamping village hire, bridal bell tent suite",
    content: `
## Creating an Unforgettable Festival Wedding Experience

Hosting an outdoor wedding in the Scottish countryside is one of the most memorable ways to celebrate. Creating a **pop-up canvas village** allows your bridal party and guests to stay on-site under festoon lighting, eliminating expensive midnight taxi logistics and keeping the celebration alive under the stars.

---

### Step 1: Spatial Planning & Site Assessment
When planning a multi-tent glamping village on private estate grounds or farm pastures, evaluate:
* **Ground Drainage:** Flat, well-draining pasture grass is ideal. Avoid low-lying hollows where morning dew collects.
* **Tents Footprint:** Allow 8–10 meters between tent centerpoints for privacy, guy lines, and safe illuminated walkways.
* **Bridal Suite Separation:** Position the luxury 6M Cathedral Bridal Suite in a secluded scenic spot with panoramic views, separate from the main guest village circle.

---

### Step 2: Power, Lighting & Atmosphere
* **Festoon Pathways:** Solar and low-voltage warm LED festoon lighting poles create magical walkways between the marquee and canvas village.
* **Bedside Power Units:** For phone charging and personal heaters, our portable battery power stations keep guests comfortable without generator noise.
* **Hotel-Grade Linen:** We provide fresh 300-thread-count hotel linens, down-feel duvets, bedside tables, mirrors, and botanical welcome amenities for every guest.
    `
  },
  {
    slug: "nc500-wild-camping-route",
    title: "The Ultimate NC500 Glamping & Camping Pitch Guide",
    excerpt: "Navigate the North Coast 500 with confidence. Learn about Scottish Outdoor Access Code rules, coastal headlands, and route driving times from our base.",
    category: "guides",
    categoryName: "Glamping Guides",
    author: {
      name: "Callum Fraser",
      role: "Lead Pitch Logistics & Scotland Guide",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    date: "April 04, 2026",
    isoDate: "2026-04-04T10:00:00Z",
    readTime: "7 min read",
    featured: false,
    status: "published",
    image: "/campsite_fidden_farm.jpg",
    imageAlt: "Coastal camping pitch along the scenic North Coast 500 route in the Scottish Highlands",
    seoTitle: "The Ultimate NC500 Glamping & Camping Guide (Scotland)",
    seoDescription: "Expert guide to camping and bell tent glamping on Scotland's NC500. Pitch locations, drive times, Highland weather tips, and essential stops.",
    keywords: "nc500 glamping, nc500 camping guide, north coast 500 tent rental, highland glamping scotland",
    content: `
## Driving Scotland's Legendary 516-Mile Coastal Loop

The North Coast 500 is rightfully celebrated as one of the world's most spectacular coastal road trips. From the dramatic sea cliffs of Caithness to the turquoise bays of Wester Ross and the wild peaks of Assynt, exploring the route in a breathable luxury bell tent is the purest way to connect with the landscape.

---

### Highlights Along the Route
* **Wester Ross (Applecross & Bealach na Bà):** Dramatic mountain pass driving leading to sheltered sea lochs and fresh langoustine dinners.
* **Assynt & Achmelvich:** Crystal turquoise waters reminiscent of the Caribbean, framed by prehistoric Torridonian sandstone mountains like Suilven and Stac Pollaidh.
* **Sutherland & Durness:** Wild, sweeping moors and immense limestone sea caves like Smoo Cave.
    `
  },
  {
    slug: "kids-sleepover-party-ideas",
    title: "Creating the Ultimate Garden Sleepover Party for Kids",
    excerpt: "Transform your garden into a magical wonderland with cinema projectors, outdoor gaming lounger setups, fairy lighting, and cozy hotel-grade bedding.",
    category: "tips",
    categoryName: "Camping Tips",
    author: {
      name: "Kirsty MacLeod",
      role: "Event & Wedding Canvas Coordinator",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
    },
    date: "July 15, 2026",
    isoDate: "2026-07-15T10:00:00Z",
    readTime: "5 min read",
    featured: false,
    status: "published",
    image: "/blog_garden_party_sleepover.jpg",
    imageAlt: "Magical garden sleepover bell tent with fairy lights and cinema lounge setup",
    seoTitle: "Ultimate Garden Sleepover Party Ideas for Kids | Scotland",
    seoDescription: "How to host an unforgettable garden bell tent sleepover party in Scotland. Cinema projectors, cozy fairy light setups, and fun birthday ideas.",
    keywords: "garden sleepover party scotland, kids bell tent party, birthday glamping edinburgh glasgow, cinema tent hire",
    content: `
## Transform Your Lawn into a 5-Star Camp Wonderland

Birthday parties and summer celebrations reach a whole new level when you pitch a 5M bell tent in your back garden. With our **Cosy Living Lounge** and luxury bedding packages, children experience the thrill of sleeping under the stars with all the comfort and security of home.

---

### Popular Party Themes
1. **Under-the-Stars Cinema Lounge:** An HD mini-projector inside the canvas tent projecting movies onto the white interior wall with popcorn baskets and bean bags.
2. **Wilderness Campout:** Firepit marshmallow toasting, stargazing guides, and story lanterns.
3. **Boho Fairy Tale:** Floral garlands, fairy lighting canopies, and bespoke name bunting.
    `
  },
  {
    slug: "essential-packing-glamping-scotland",
    title: "What to Pack for a Scottish Canvas Camping Adventure",
    excerpt: "From thermal layers to midgie protection and campfire cooking gear, here is our definitive packing checklist for hassle-free Scottish glamping.",
    category: "tips",
    categoryName: "Camping Tips",
    author: {
      name: "Callum Fraser",
      role: "Lead Pitch Logistics & Scotland Guide",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    date: "June 30, 2026",
    isoDate: "2026-06-30T10:00:00Z",
    readTime: "4 min read",
    featured: false,
    status: "published",
    image: "/campsite_loch_chon.jpg",
    imageAlt: "Campfire cooking setup and packing gear beside Scottish loch",
    seoTitle: "What to Pack for Glamping in Scotland (Checklist)",
    seoDescription: "Complete packing list for glamping in Scotland. Layering advice, waterproof footwear, midgie protection, and campfire essentials.",
    keywords: "what to pack glamping scotland, scottish camping checklist, glamping essentials scotland, midgie repellent scotland",
    content: `
## Pack Smart for Every Scottish Season

Because **The Cosy Canvas Co.** provides your tent, heavy-duty air mattresses, warm duvets, lanterns, and kitchenware, you only need to pack personal gear and seasonal apparel. Here is what we recommend bringing for an effortless stay:

---

### 1. Clothing & Footwear
* **Layering System:** Breathable merino wool base layers, a warm fleece or down jacket for chilly loch-side evenings.
* **Waterproof Outer Shell:** A high-quality Gore-Tex or DWR jacket for exploring coastal paths and hill tracks.
* **Easy-Slip Footwear:** Clogs or slip-on shoes for stepping in and out of the bell tent without tracking grass inside.

### 2. Scottish Wilderness Essentials
* **Smidge / Midgie Spray:** Scotland's gold standard deet-free repellent.
* **Headlamp or Torch:** Handy for late night woodland walks to campsite facilities.
* **Reusable Water Bottle & Flask:** Perfect for warm hot chocolate or tea by the stove.
    `
  },
  {
    slug: "autumn-glamping-scotland",
    title: "Cozy Autumn Canvas Stays: Woodburners & Stargazing",
    excerpt: "Why late season camping in Scotland offers the best stargazing, crisp morning loch views, and warm indoor woodburner evenings.",
    category: "seasonal",
    categoryName: "Seasonal",
    author: {
      name: "Callum Fraser",
      role: "Lead Pitch Logistics & Scotland Guide",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    date: "May 19, 2026",
    isoDate: "2026-05-19T10:00:00Z",
    readTime: "5 min read",
    featured: false,
    status: "published",
    image: "/campsite_sallochy.jpg",
    imageAlt: "Wood-burning tent stove keeping bell tent cozy during Scottish autumn evening",
    seoTitle: "Autumn Glamping in Scotland: Wood Burners & Dark Skies",
    seoDescription: "Experience autumn camping in Scotland with indoor wood-burning tent stoves, golden foliage, quiet campsites, and incredible stargazing.",
    keywords: "autumn glamping scotland, wood burner tent hire scotland, dark sky camping scotland, october camping scotland",
    content: `
## Why Autumn is Scotland's Best Kept Glamping Secret

While summer draws the largest crowds, seasoned Scottish campers know that September, October, and early November are truly magical months. The midgies have vanished, the birch and bracken forests turn glowing shades of amber and gold, and the crisp night skies are remarkably clear.

---

### The Magic of the Indoor Wood Burner
There is nothing quite like listening to rain patter against heavy cotton canvas while sitting beside a glowing wood-burning stove inside your bell tent. Our stoves include spark arrestors, heatproof silicone flashing kits, and kiln-dried hardwood logs that keep your canvas sanctuary warm all night long.
    `
  }
];
