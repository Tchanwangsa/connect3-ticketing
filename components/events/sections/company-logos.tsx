/* ── Preset companies with logos and categories ── */

export type CompanyCategory =
  | "All"
  | "Tech"
  | "Consulting"
  | "Banking"
  | "Quant / Trading"
  | "Professional Services";

export const COMPANY_CATEGORIES: CompanyCategory[] = [
  "All",
  "Tech",
  "Consulting",
  "Banking",
  "Quant / Trading",
  "Professional Services",
];

export interface PresetCompany {
  name: string;
  logoUrl: string;
  category: CompanyCategory;
}

export const PRESET_COMPANIES: PresetCompany[] = [
  // Tech
  { name: "Google", logoUrl: "/companies/google.svg", category: "Tech" },
  { name: "Microsoft", logoUrl: "/companies/microsoft.svg", category: "Tech" },
  { name: "Meta", logoUrl: "/companies/meta.svg", category: "Tech" },
  { name: "Atlassian", logoUrl: "/companies/atlassian.svg", category: "Tech" },

  // Consulting
  {
    name: "Accenture",
    logoUrl: "/companies/accenture.svg",
    category: "Consulting",
  },
  {
    name: "Deloitte",
    logoUrl: "/companies/deloitte.svg",
    category: "Consulting",
  },
  { name: "EY", logoUrl: "/companies/ey.svg", category: "Consulting" },
  { name: "KPMG", logoUrl: "/companies/kpmg.svg", category: "Consulting" },
  { name: "PwC", logoUrl: "/companies/pwc.svg", category: "Consulting" },

  // Banking
  { name: "ANZ", logoUrl: "/companies/anz.svg", category: "Banking" },
  { name: "CommBank", logoUrl: "/companies/commbank.svg", category: "Banking" },
  {
    name: "Macquarie",
    logoUrl: "/companies/macquarie.svg",
    category: "Banking",
  },
  { name: "NAB", logoUrl: "/companies/nab.svg", category: "Banking" },

  // Quant / Trading
  {
    name: "Citadel",
    logoUrl: "/companies/citadel.svg",
    category: "Quant / Trading",
  },
  {
    name: "IMC",
    logoUrl: "/companies/imc_logo.svg",
    category: "Quant / Trading",
  },
  {
    name: "Jane Street",
    logoUrl: "/companies/jane_street.svg",
    category: "Quant / Trading",
  },
  {
    name: "Optiver",
    logoUrl: "/companies/optiver.svg",
    category: "Quant / Trading",
  },
];
