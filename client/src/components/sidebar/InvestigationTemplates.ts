/**
 * Silent Partners - Investigation Templates
 *
 * Pre-built investigation templates organized by use case.
 */

export interface InvestigationTemplate {
  id: string;
  name: string;
  category: 'corporate' | 'financial' | 'people' | 'examples';
  query: string;
  description: string;
  prebuilt?: boolean;
}

export const INVESTIGATION_TEMPLATES: InvestigationTemplate[] = [
  // Corporate Investigations
  {
    id: 'corporate-structure',
    name: 'Corporate Structure',
    category: 'corporate',
    query: 'Map the ownership structure, subsidiaries, and key executives of [Company Name]',
    description: 'Trace corporate hierarchies and beneficial ownership',
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence',
    category: 'corporate',
    query: 'Research [Person/Company] background, business history, legal issues, and key relationships',
    description: 'Background check for business partnerships',
  },

  // Financial Investigations
  {
    id: 'money-trail',
    name: 'Money Trail',
    category: 'financial',
    query: 'Trace the flow of funds and financial relationships involving [Entity]',
    description: 'Follow financial connections and transactions',
  },
  {
    id: 'shell-companies',
    name: 'Shell Company Network',
    category: 'financial',
    query: 'Map shell companies, offshore entities, and nominee directors connected to [Entity]',
    description: 'Uncover hidden corporate structures',
  },

  // People Networks
  {
    id: 'influence-network',
    name: 'Influence Network',
    category: 'people',
    query: 'Map the professional network, board memberships, and political connections of [Person]',
    description: 'Understand who influences whom',
  },
  {
    id: 'family-business',
    name: 'Family Business',
    category: 'people',
    query: 'Map family members and their business interests for [Family Name]',
    description: 'Family business empires and dynasties',
  },

  // Historical Examples (pre-built networks)
  {
    id: '1mdb',
    name: '1MDB Scandal',
    category: 'examples',
    query: 'Map the key players and financial connections in the 1MDB scandal involving Jho Low and Malaysian government officials',
    description: 'Multi-billion dollar embezzlement case',
    prebuilt: true,
  },
  {
    id: 'bcci',
    name: 'BCCI',
    category: 'examples',
    query: 'Map the Bank of Credit and Commerce International scandal network including key figures and shell companies',
    description: 'Historic banking fraud network',
    prebuilt: true,
  },
  {
    id: 'epstein',
    name: 'Epstein Network',
    category: 'examples',
    query: 'Map Jeffrey Epstein network of associates, connections to financial institutions and powerful individuals',
    description: 'Power and influence network',
    prebuilt: true,
  },
];

// Legacy export for backward compatibility
export const EXAMPLE_NETWORKS = INVESTIGATION_TEMPLATES;
