require("dotenv").config();
const { v4: uuid } = require("uuid");
const bcrypt = require("bcryptjs");
const db = require("./index");

function slugify(title, year) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + (year ? `-${year}` : "")
  );
}

const seedMovies = [
  {
    title: "Nairobi Half Life",
    release_year: 2012,
    genres: ["Drama", "Crime"],
    director: "David \"Tosh\" Gitonga",
    synopsis:
      "An aspiring actor leaves his rural home for Nairobi chasing a break into film, and is pulled into the city's street hustle and a gang of small-time thieves while trying to hold on to his dream.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Supa Modo",
    release_year: 2018,
    genres: ["Drama", "Family"],
    director: "Likarion Wainaina",
    synopsis:
      "A terminally ill nine-year-old girl who dreams of being a superhero gets her wish when her family and an entire village come together to make her final months feel like a real-life action movie.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Rafiki",
    release_year: 2018,
    genres: ["Drama", "Romance"],
    director: "Wanuri Kahiu",
    synopsis:
      "Two young women from rival political families in Nairobi form a close bond that grows into something deeper, forcing them to choose between happiness and the expectations of their community.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Kati Kati",
    release_year: 2016,
    genres: ["Drama", "Fantasy"],
    director: "Mbithi Masya",
    synopsis:
      "A woman wakes up with no memory in a mysterious resort in the middle of the bush, surrounded by other lost souls who help her piece together the truth about where she really is.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Watu Wote (All of Us)",
    release_year: 2017,
    genres: ["Drama", "Short"],
    director: "Katja Benrath",
    synopsis:
      "Inspired by true events, a bus journey across Kenya turns tense when armed attackers stop the vehicle, and passengers of different faiths choose to protect one another rather than turn on each other.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Click Click Bang",
    release_year: 2021,
    genres: ["Thriller", "Drama"],
    director: "Sharon Maka",
    synopsis:
      "A group of friends running a photography and content hustle in Nairobi get entangled in blackmail and betrayal after a job goes wrong, testing loyalties in the city's gig economy underworld.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "40 Sticks",
    release_year: 2020,
    genres: ["Action", "Crime"],
    director: "Bob Nyanja",
    synopsis:
      "A tightly planned heist in Nairobi begins to unravel as old grudges, shifting loyalties and a determined detective close in on the crew before they can pull off the job.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Plan B",
    release_year: 2021,
    genres: ["Drama", "Romance"],
    director: "Melissa Kiplagat",
    synopsis:
      "A young woman navigates an unplanned pregnancy and a complicated relationship, confronting family pressure and her own ambitions as she tries to figure out what she actually wants from life.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Disconnect",
    release_year: 2021,
    genres: ["Drama"],
    director: "Sarah Muthoni",
    synopsis:
      "A married couple's relationship is tested when secrets from their past resurface, forcing them to confront how far apart they have grown despite living under the same roof.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Volumes",
    release_year: 2022,
    genres: ["Drama", "Music"],
    director: "Erick Ohaga",
    synopsis:
      "An up-and-coming musician in Nairobi's underground scene struggles to balance the pressure of chasing fame with staying true to the sound and community that shaped him.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Crime and Justice: Grazer",
    release_year: 2023,
    genres: ["Crime", "Drama"],
    director: "Wanjiru Kairu",
    synopsis:
      "A homicide detective investigates a string of killings tied to Nairobi's underworld, uncovering how corruption and desperation blur the line between victim and perpetrator.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Sincerely Daisy",
    release_year: 2023,
    genres: ["Comedy", "Drama"],
    director: "Toni Kamau",
    synopsis:
      "A social-media-savvy young woman in Nairobi documents her chaotic love life and career ambitions, learning that the version of herself she performs online isn't always the one she needs to be.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Country Queen",
    release_year: 2022,
    genres: ["Drama"],
    director: " 	Katunga Ngera",
    synopsis:
      "A young woman returns from Nairobi to her rural hometown and finds herself leading the fight against a powerful mining company threatening to destroy her community's land and way of life.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "The Battle of the Souls",
    release_year: 2019,
    genres: ["Drama"],
    director: "Marc Wachira",
    synopsis:
      "A pastor's family is torn apart when questions of faith, ambition and betrayal come to a head, forcing each member to reckon with what they truly believe in.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Subira",
    release_year: 2018,
    genres: ["Drama"],
    director: "Ravneet Sippy Chadha",
    synopsis:
      "A talented young swimmer on the Kenyan coast is torn between her Islamic faith, family expectations of an arranged marriage, and her own dream of competing.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
  {
    title: "Toto Millionaire",
    release_year: 2022,
    genres: ["Comedy", "Family"],
    director: "Sarah Hassan",
    synopsis:
      "A street-smart Nairobi kid stumbles into a fortune and must outwit adults who want to take it from him, all while trying to help the family and friends who actually care about him.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "released",
  },
];

const upcomingSeed = [
  {
    title: "Nairobi Half Life 2",
    release_year: 2026,
    genres: ["Drama", "Crime"],
    director: "TBA",
    synopsis:
      "A long-rumoured follow-up to the acclaimed 2012 film, said to revisit Nairobi's street-level hustle a decade on. Details are still emerging as production news breaks.",
    language: "Swahili/English",
    is_kenyan: 1,
    status: "upcoming",
  },
];

function run() {
  const insertMovie = db.prepare(`
    INSERT OR IGNORE INTO movies
      (id, title, slug, synopsis, genres, release_year, release_date, status, director, cast, language, county_origin, poster_url, trailer_url, source_urls, is_kenyan, added_by_ai)
    VALUES (@id, @title, @slug, @synopsis, @genres, @release_year, @release_date, @status, @director, @cast, @language, @county_origin, @poster_url, @trailer_url, @source_urls, @is_kenyan, 0)
  `);

  const all = [...seedMovies, ...upcomingSeed];
  const tx = db.transaction((rows) => {
    for (const m of rows) {
      insertMovie.run({
        id: uuid(),
        title: m.title,
        slug: slugify(m.title, m.release_year),
        synopsis: m.synopsis || "",
        genres: JSON.stringify(m.genres || []),
        release_year: m.release_year || null,
        release_date: m.release_date || null,
        status: m.status || "released",
        director: m.director || "",
        cast: JSON.stringify(m.cast || []),
        language: m.language || "Swahili/English",
        county_origin: m.county_origin || "",
        poster_url: m.poster_url || "",
        trailer_url: m.trailer_url || "",
        source_urls: JSON.stringify(m.source_urls || []),
        is_kenyan: m.is_kenyan ? 1 : 0,
      });
    }
  });
  tx(all);

  // Demo admin account so the AI-discovery / admin actions can be tested immediately.
  // CHANGE THIS PASSWORD (or delete the account) before deploying anywhere public.
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@kereview.co.ke");
  if (!existing) {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, is_admin) VALUES (?, ?, ?, ?, 1)`
    ).run(uuid(), "KeReview Admin", "admin@kereview.co.ke", bcrypt.hashSync("ChangeMe123!", 10));
    console.log("Created demo admin: admin@kereview.co.ke / ChangeMe123!  (please change this)");
  }

  console.log(`Seeded ${all.length} movies.`);
}

run();
