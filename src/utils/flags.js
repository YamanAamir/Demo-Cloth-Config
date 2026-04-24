// All flags — country flags via flagcdn.com + special/regional flags

// Country flags
export const COUNTRY_FLAGS = [
  { name: "Afghanistan", code: "af" },
  { name: "Albania", code: "al" },
  { name: "Algeria", code: "dz" },
  { name: "Argentina", code: "ar" },
  { name: "Australia", code: "au" },
  { name: "Austria", code: "at" },
  { name: "Bangladesh", code: "bd" },
  { name: "Belgium", code: "be" },
  { name: "Brazil", code: "br" },
  { name: "Bulgaria", code: "bg" },
  { name: "Canada", code: "ca" },
  { name: "Chile", code: "cl" },
  { name: "China", code: "cn" },
  { name: "Colombia", code: "co" },
  { name: "Croatia", code: "hr" },
  { name: "Czech Republic", code: "cz" },
  { name: "Denmark", code: "dk" },
  { name: "Egypt", code: "eg" },
  { name: "Estonia", code: "ee" },
  { name: "Ethiopia", code: "et" },
  { name: "Finland", code: "fi" },
  { name: "France", code: "fr" },
  { name: "Germany", code: "de" },
  { name: "Ghana", code: "gh" },
  { name: "Greece", code: "gr" },
  { name: "Hungary", code: "hu" },
  { name: "Iceland", code: "is" },
  { name: "India", code: "in" },
  { name: "Indonesia", code: "id" },
  { name: "Iran", code: "ir" },
  { name: "Iraq", code: "iq" },
  { name: "Ireland", code: "ie" },
  { name: "Israel", code: "il" },
  { name: "Italy", code: "it" },
  { name: "Japan", code: "jp" },
  { name: "Jordan", code: "jo" },
  { name: "Kenya", code: "ke" },
  { name: "Latvia", code: "lv" },
  { name: "Lebanon", code: "lb" },
  { name: "Lithuania", code: "lt" },
  { name: "Malaysia", code: "my" },
  { name: "Mexico", code: "mx" },
  { name: "Morocco", code: "ma" },
  { name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" },
  { name: "Nigeria", code: "ng" },
  { name: "North Korea", code: "kp" },
  { name: "Norway", code: "no" },
  { name: "Pakistan", code: "pk" },
  { name: "Palestine", code: "ps" },
  { name: "Peru", code: "pe" },
  { name: "Philippines", code: "ph" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Romania", code: "ro" },
  { name: "Russia", code: "ru" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Serbia", code: "rs" },
  { name: "Slovakia", code: "sk" },
  { name: "Slovenia", code: "si" },
  { name: "Somalia", code: "so" },
  { name: "South Africa", code: "za" },
  { name: "South Korea", code: "kr" },
  { name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },
  { name: "Syria", code: "sy" },
  { name: "Thailand", code: "th" },
  { name: "Tunisia", code: "tn" },
  { name: "Turkey", code: "tr" },
  { name: "Ukraine", code: "ua" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Venezuela", code: "ve" },
  { name: "Vietnam", code: "vn" },
  { name: "Yemen", code: "ye" },
].map(f => ({
  ...f,
  flag: `https://flagcdn.com/w160/${f.code}.png`,
  flagHD: `https://flagcdn.com/w320/${f.code}.png`,
}));

// Special / regional flags (fixed)
export const SPECIAL_FLAGS = [
  {
    name: "Palestine",
    flag: "https://flagcdn.com/w160/ps.png",
    flagHD: "https://flagcdn.com/w320/ps.png",
  },
  {
    name: "Kurdistan",
    flag: "https://flagcdn.com/w160/iq.png", // fallback
    flagHD: "https://flagcdn.com/w320/iq.png",
  },
  {
    name: "Tamil Eelam",
    flag: "https://flagcdn.com/w160/in.png",
    flagHD: "https://flagcdn.com/w320/in.png",
  },
  {
    name: "Kashmir",
    flag: "https://flagcdn.com/w160/pk.png",
    flagHD: "https://flagcdn.com/w320/pk.png",
  },
  {
    name: "Catalonia",
    flag: "https://flagcdn.com/w160/es.png",
    flagHD: "https://flagcdn.com/w320/es.png",
  },
  {
    name: "Scotland",
    flag: "https://flagcdn.com/w160/gb-sct.png",
    flagHD: "https://flagcdn.com/w320/gb-sct.png",
  },
  {
    name: "Wales",
    flag: "https://flagcdn.com/w160/gb-wls.png",
    flagHD: "https://flagcdn.com/w320/gb-wls.png",
  },
  {
    name: "Faroe Islands",
    flag: "https://flagcdn.com/w160/fo.png",
    flagHD: "https://flagcdn.com/w320/fo.png",
  },
  {
    name: "Greenland",
    flag: "https://flagcdn.com/w160/gl.png",
    flagHD: "https://flagcdn.com/w320/gl.png",
  },
  {
    name: "EU",
    flag: "https://flagcdn.com/w160/eu.png",
    flagHD: "https://flagcdn.com/w320/eu.png",
  },
  {
    name: "Rainbow Pride",
    flag: "https://flagcdn.com/w160/us.png", // fallback
    flagHD: "https://flagcdn.com/w320/us.png",
  },
];

// Combined list
export const ALL_FLAGS = [...COUNTRY_FLAGS, ...SPECIAL_FLAGS];

// Get flag URL (case-insensitive + fallback)
export const getFlagUrl = (name) => {
  if (!name) return null;

  const found = ALL_FLAGS.find(
    f => f.name.toLowerCase() === name.toLowerCase()
  );

  return (
    found?.flagHD ||
    found?.flag ||
    "https://via.placeholder.com/160?text=Flag"
  );
};