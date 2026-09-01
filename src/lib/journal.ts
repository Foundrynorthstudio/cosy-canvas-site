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
