// src/utils/countryHelper.js
import { supabase } from '../supabaseClient';

/**
 * Mapping of indeed_search_country values to display labels and flag codes.
 * Key should be Uppercase and trimmed.
 */
export const COUNTRY_MAP = {
  // ── Tier 1 Priority Countries ────────────────────────────────────────────────
  "USA":               { label: "United States",          flag: "us" },
  "UK":                { label: "United Kingdom",          flag: "gb" },
  "UNITEDARABEMIRATES":{ label: "United Arab Emirates",   flag: "ae" },
  "CANADA":            { label: "Canada",                  flag: "ca" },
  "INDIA":             { label: "India",                   flag: "in" },
  "IRELAND":           { label: "Ireland",                 flag: "ie" },
  "JAPAN":             { label: "Japan",                   flag: "jp" },
  // ── Rest of World (A–Z) ─────────────────────────────────────────────────────
  "ARGENTINA":         { label: "Argentina",               flag: "ar" },
  "AUSTRALIA":         { label: "Australia",               flag: "au" },
  "AUSTRIA":           { label: "Austria",                 flag: "at" },
  "BAHRAIN":           { label: "Bahrain",                 flag: "bh" },
  "BELGIUM":           { label: "Belgium",                 flag: "be" },
  "BRAZIL":            { label: "Brazil",                  flag: "br" },
  "CHILE":             { label: "Chile",                   flag: "cl" },
  "CHINA":             { label: "China",                   flag: "cn" },
  "COLOMBIA":          { label: "Colombia",                flag: "co" },
  "COSTARICA":         { label: "Costa Rica",              flag: "cr" },
  "CZECHREPUBLIC":     { label: "Czech Republic",          flag: "cz" },
  "DENMARK":           { label: "Denmark",                 flag: "dk" },
  "ECUADOR":           { label: "Ecuador",                 flag: "ec" },
  "EGYPT":             { label: "Egypt",                   flag: "eg" },
  "FINLAND":           { label: "Finland",                 flag: "fi" },
  "FRANCE":            { label: "France",                  flag: "fr" },
  "GERMANY":           { label: "Germany",                 flag: "de" },
  "GREECE":            { label: "Greece",                  flag: "gr" },
  "HONGKONG":          { label: "Hong Kong",               flag: "hk" },
  "HUNGARY":           { label: "Hungary",                 flag: "hu" },
  "INDONESIA":         { label: "Indonesia",               flag: "id" },
  "ISRAEL":            { label: "Israel",                  flag: "il" },
  "ITALY":             { label: "Italy",                   flag: "it" },
  "KUWAIT":            { label: "Kuwait",                  flag: "kw" },
  "LUXEMBOURG":        { label: "Luxembourg",              flag: "lu" },
  "MALAYSIA":          { label: "Malaysia",                flag: "my" },
  "MEXICO":            { label: "Mexico",                  flag: "mx" },
  "MOROCCO":           { label: "Morocco",                 flag: "ma" },
  "NETHERLANDS":       { label: "Netherlands",             flag: "nl" },
  "NEWZEALAND":        { label: "New Zealand",             flag: "nz" },
  "NIGERIA":           { label: "Nigeria",                 flag: "ng" },
  "NORWAY":            { label: "Norway",                  flag: "no" },
  "OMAN":              { label: "Oman",                    flag: "om" },
  "PAKISTAN":          { label: "Pakistan",                flag: "pk" },
  "PANAMA":            { label: "Panama",                  flag: "pa" },
  "PERU":              { label: "Peru",                    flag: "pe" },
  "PHILIPPINES":       { label: "Philippines",             flag: "ph" },
  "POLAND":            { label: "Poland",                  flag: "pl" },
  "PORTUGAL":          { label: "Portugal",                flag: "pt" },
  "QATAR":             { label: "Qatar",                   flag: "qa" },
  "ROMANIA":           { label: "Romania",                 flag: "ro" },
  "SAUDIARABIA":       { label: "Saudi Arabia",            flag: "sa" },
  "SINGAPORE":         { label: "Singapore",               flag: "sg" },
  "SOUTHAFRICA":       { label: "South Africa",            flag: "za" },
  "SOUTHKOREA":        { label: "South Korea",             flag: "kr" },
  "SPAIN":             { label: "Spain",                   flag: "es" },
  "SWEDEN":            { label: "Sweden",                  flag: "se" },
  "SWITZERLAND":       { label: "Switzerland",             flag: "ch" },
  "TAIWAN":            { label: "Taiwan",                  flag: "tw" },
  "THAILAND":          { label: "Thailand",                flag: "th" },
  "TURKEY":            { label: "Turkey",                  flag: "tr" },
  "UKRAINE":           { label: "Ukraine",                 flag: "ua" },
  "URUGUAY":           { label: "Uruguay",                 flag: "uy" },
  "VENEZUELA":         { label: "Venezuela",               flag: "ve" },
  "VIETNAM":           { label: "Vietnam",                 flag: "vn" },
  // ── Common DB aliases (alternate keys some records use) ───────────────────────
  "UA":                { label: "Ukraine",                 flag: "ua" },
  "UKR":               { label: "Ukraine",                 flag: "ua" },
  "US":                { label: "United States",           flag: "us" },
  "GB":                { label: "United Kingdom",          flag: "gb" },
  "AE":                { label: "United Arab Emirates",    flag: "ae" },
  "KR":                { label: "South Korea",             flag: "kr" },
  "HK":                { label: "Hong Kong",               flag: "hk" },
  "NZ":                { label: "New Zealand",             flag: "nz" },
  "CZ":                { label: "Czech Republic",          flag: "cz" },
  "ZA":                { label: "South Africa",            flag: "za" },
  "SA":                { label: "Saudi Arabia",            flag: "sa" },
  "CR":                { label: "Costa Rica",              flag: "cr" },
  "IL":                { label: "Israel",                  flag: "il" },
  "TH":                { label: "Thailand",                flag: "th" },
  "IE":                { label: "Ireland",                 flag: "ie" },
  "JP":                { label: "Japan",                   flag: "jp" },
  "IT":                { label: "Italy",                   flag: "it" },
  "BR":                { label: "Brazil",                  flag: "br" },
  "MX":                { label: "Mexico",                  flag: "mx" },
  "ES":                { label: "Spain",                   flag: "es" },
  "DE":                { label: "Germany",                 flag: "de" },
  "ID":                { label: "Indonesia",               flag: "id" },
};

export const PRIORITY = ["USA", "UK", "UNITEDARABEMIRATES", "CANADA", "INDIA", "IRELAND", "JAPAN"];

/**
 * Returns all countries from COUNTRY_MAP sorted by priority then alphabetically.
 * Using COUNTRY_MAP directly ensures all 62 countries are always shown,
 * without depending on which rows appear in a limited DB scan.
 */
export const getAvailableCountries = async () => {
  try {
    const seenLabels = new Set();
    const uniqueCountries = [];

    // 1. Process Priority keys first to ensure they are the ones selected for unique list
    PRIORITY.forEach(code => {
      const meta = COUNTRY_MAP[code];
      if (meta) {
        const normalizedLabel = meta.label.trim().toLowerCase();
        if (!seenLabels.has(normalizedLabel)) {
          seenLabels.add(normalizedLabel);
          uniqueCountries.push({
            id:       code,
            value:    code,
            label:    meta.label.trim(),
            name:     meta.label.trim(),
            flagCode: meta.flag,
          });
        }
      }
    });

    // 2. Process the rest
    Object.entries(COUNTRY_MAP).forEach(([code, meta]) => {
      const normalizedLabel = meta.label.trim().toLowerCase();
      if (!seenLabels.has(normalizedLabel)) {
        seenLabels.add(normalizedLabel);
        uniqueCountries.push({
          id:       code,
          value:    code,
          label:    meta.label.trim(),
          name:     meta.label.trim(),
          flagCode: meta.flag,
        });
      }
    });

    // Sort: priority first, then alphabetical
    uniqueCountries.sort((a, b) => {
      const pa = PRIORITY.indexOf(a.value);
      const pb = PRIORITY.indexOf(b.value);
      if (pa !== -1 && pb !== -1) return pa - pb;
      if (pa !== -1) return -1;
      if (pb !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    return uniqueCountries;
  } catch (err) {
    console.error('Failed to build country list:', err);
    return [];
  }
};

