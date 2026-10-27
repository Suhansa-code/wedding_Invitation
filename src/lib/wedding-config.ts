export const weddingConfig = {
  bride: { name: "Dulmi", parents: "Daughter of Mr and Mrs", family: "Padukka" },
  groom: { name: "Isuru", parents: "Son of Mr and Mrs", family: "Ediriweera" },
  dateLabel: "Monday, 23 November 2026",
  dateISO: "2026-11-23",
  date: { month: "NOVEMBER", weekday: "MONDAY", day: "23", year: "2026" },
  time: "10 AM TO 4.00 PM",
  venue: "The Stallions Banquet Hall",
  address: "No: B/2 Nayagoda Road, Gonapola",
  directions:
    "https://maps.app.goo.gl/QGAZavf3ThqrCqGQ8",
  contacts: [
    { name: "Isuru", phone: "076 210 1024", href: "tel:+94762101024" },
    { name: "Dulmi", phone: "077 222 8796", href: "tel:+94772228796" },
  ],
} as const;
