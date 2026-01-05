/**
 * Initial network datasets for Silent Partners
 * Contains real network data from three major scandals/networks
 */

// UNCONDITIONAL TOP-LEVEL LOGGING
console.log('🔍 initial_data.js loaded and executing');
try {
    console.log('🔍 Window object exists:', !!window);
    console.log('🔍 Document object exists:', !!document);
} catch (e) {
    console.error('🔍 Error accessing window/document:', e);
}

// Initialize the global object
console.log('🔍 Initializing silentPartners object');
window.silentPartners = window.silentPartners || {};
window.silentPartners.initialData = {};
console.log('🔍 silentPartners object initialized:', window.silentPartners);

// 1MDB Scandal Network
window.silentPartners.initialData.oneMDB = {
  "title": "1MDB Scandal",
  "description": "Relationship map of the 1MDB scandal showing entities and their interconnections from systematic analysis of court files and other resources.",
  "nodes": [
    {
      "id": "jho_low",
      "name": "Low Taek Jho (Jho Low)",
      "type": "person",
      "importance": 1
    },
    {
      "id": "najib_razak",
      "name": "Najib Razak",
      "type": "person",
      "importance": 0.95
    },
    {
      "id": "rosmah_mansor",
      "name": "Rosmah Mansor",
      "type": "person",
      "importance": 0.85
    },
    {
      "id": "riza_aziz",
      "name": "Riza Aziz",
      "type": "person",
      "importance": 0.85
    },
    {
      "id": "khadem_al_qubaisi",
      "name": "Khadem Al Qubaisi",
      "type": "person",
      "importance": 0.9
    },
    {
      "id": "mohamed_al_husseiny",
      "name": "Mohamed Al Husseiny",
      "type": "person",
      "importance": 0.85
    },
    {
      "id": "timothy_leissner",
      "name": "Timothy Leissner",
      "type": "person",
      "importance": 0.85
    },
    {
      "id": "eric_tan",
      "name": "Eric Tan (Tan Kim Loong)",
      "type": "person",
      "importance": 0.8
    },
    {
      "id": "jasmine_loo",
      "name": "Jasmine Loo",
      "type": "person",
      "importance": 0.75
    },
    {
      "id": "pras_michel",
      "name": "Prakazrel Samuel Michél (Pras)",
      "type": "person",
      "importance": 0.8
    },
    {
      "id": "larry_low",
      "name": "Larry Low",
      "type": "person",
      "importance": 0.45
    },
    {
      "id": "low_taek_szen",
      "name": "Low Taek Szen",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "goh_gaik_ewe",
      "name": "Goh Gaik Ewe",
      "type": "person",
      "importance": 0.45
    },
    {
      "id": "szen_low",
      "name": "Szen Low",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "may_lin_low",
      "name": "May-Lin Low",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "nazir_razak",
      "name": "Nazir Razak",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "norashman_najib",
      "name": "Norashman Najib",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "nooryana_najib",
      "name": "Nooryana Najib",
      "type": "person",
      "importance": 0.45
    },
    {
      "id": "nawaf_obaid",
      "name": "Nawaf Obaid",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "lloyd_blankfein",
      "name": "Lloyd Blankfein",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "gary_cohn",
      "name": "Gary Cohn",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "roger_ng",
      "name": "Roger Ng",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "michael_evans",
      "name": "Michael Evans",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "andrea_vella",
      "name": "Andrea Vella",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "david_ryan",
      "name": "David Ryan",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "alex_turnbull",
      "name": "Alex Turnbull",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "mark_schwartz",
      "name": "Mark Schwartz",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "toby_watson",
      "name": "Toby Watson",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "tarek_obaid",
      "name": "Tarek Obaid",
      "type": "person",
      "importance": 0.8
    },
    {
      "id": "patrick_mahony",
      "name": "Patrick Mahony",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "prince_turki",
      "name": "Prince Turki",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "xavier_justo",
      "name": "Xavier Justo",
      "type": "person",
      "importance": 0.8
    },
    {
      "id": "laura_justo",
      "name": "Laura Justo",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "hanspeter_brunner",
      "name": "Hanspeter Brunner",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "yak_yew_chee",
      "name": "Yak Yew Chee",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "alfredo_gysi",
      "name": "Alfredo Gysi",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "yeo_jiawei",
      "name": "Yeo Jiawei",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "eduardo_leemann",
      "name": "Eduardo Leemann",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "joanna_yu",
      "name": "Joanna Yu",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "cheah_tek_kuang",
      "name": "Cheah Tek Kuang",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "singapore_banker_1",
      "name": "Singapore Banker 1",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "leonardo_dicaprio",
      "name": "Leonardo DiCaprio",
      "type": "person",
      "importance": 0.75
    },
    {
      "id": "martin_scorsese",
      "name": "Martin Scorsese",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "jordan_belfort",
      "name": "Jordan Belfort",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "joey_mcfarland",
      "name": "Joey McFarland",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "miranda_kerr",
      "name": "Miranda Kerr",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "paris_hilton",
      "name": "Paris Hilton",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "danny_abeckaser",
      "name": "Danny Abeckaser",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "noah_tepperberg",
      "name": "Noah Tepperberg",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "jason_strauss",
      "name": "Jason Strauss",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "raphael_de_niro",
      "name": "Raphael De Niro",
      "type": "person",
      "importance": 0.45
    },
    {
      "id": "ot_genasis",
      "name": "O.T. Genasis",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "lindsay_lohan",
      "name": "Lindsay Lohan",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "lady_gaga",
      "name": "Lady Gaga",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "snoop_dogg",
      "name": "Snoop Dogg",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "dr_dre",
      "name": "Dr. Dre",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "beyonce",
      "name": "Beyoncé",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "jay_z",
      "name": "Jay-Z",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "kanye_west",
      "name": "Kanye West",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "kate_upton",
      "name": "Kate Upton",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "bradley_cooper",
      "name": "Bradley Cooper",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "bar_refaeli",
      "name": "Bar Refaeli",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "kristen_wiig",
      "name": "Kristen Wiig",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "jon_hamm",
      "name": "Jon Hamm",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "swizz_beatz",
      "name": "Swizz Beatz",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "alicia_keys",
      "name": "Alicia Keys",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "president_obama",
      "name": "Barack Obama",
      "type": "person",
      "importance": 0.8
    },
    {
      "id": "ben_rhodes",
      "name": "Ben Rhodes",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "frank_white_jr",
      "name": "Frank White Jr.",
      "type": "person",
      "importance": 0.75
    },
    {
      "id": "shomik_dutta",
      "name": "Shomik Dutta",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "yousef_al_otaiba",
      "name": "Yousef Al Otaiba",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "crown_prince_mohammed",
      "name": "Crown Prince Sheikh Mohammed",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "sheikh_mansour",
      "name": "Sheikh Mansour",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "mahathir_mohamad",
      "name": "Mahathir Mohamad",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "anwar_ibrahim",
      "name": "Anwar Ibrahim",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "david_cameron",
      "name": "David Cameron",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "clare_rewcastle_brown",
      "name": "Clare Rewcastle-Brown",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "tong_kooi_ong",
      "name": "Tong Kooi Ong",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "ho_kay_tat",
      "name": "Ho Kay Tat",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "racem_haoues",
      "name": "Racem Haoues",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "tom_barrack_jr",
      "name": "Tom Barrack Jr.",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "ian_schrager",
      "name": "Ian Schrager",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "lorraine_schwartz",
      "name": "Lorraine Schwartz",
      "type": "person",
      "importance": 0.55
    },
    {
      "id": "kristal_fox",
      "name": "Kristal Fox",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "denise_rich",
      "name": "Denise Rich",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "shahrol_halmi",
      "name": "Shahrol Halmi",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "nik_faisal_ariff",
      "name": "Nik Faisal Ariff Kamil",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "mohammed_bakke_salleh",
      "name": "Mohammed Bakke Salleh",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "lodin_wok_kamaruddin",
      "name": "Lodin Wok Kamaruddin",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "abdul_gani_patail",
      "name": "Abdul Gani Patail",
      "type": "person",
      "importance": 0.65
    },
    {
      "id": "hamad_al_wazzan",
      "name": "Hamad Al Wazzan",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "seet_li_lin",
      "name": "Seet Li Lin",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "ivanka_trump",
      "name": "Ivanka Trump",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "ananda_krishnan",
      "name": "Ananda Krishnan",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "paul_allen",
      "name": "Paul Allen",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "winston_fisher",
      "name": "Winston Fisher",
      "type": "person",
      "importance": 0.4
    },
    {
      "id": "1mdb",
      "name": "1Malaysia Development Berhad (1MDB)",
      "type": "government",
      "importance": 0.95
    },
    {
      "id": "goldman_sachs",
      "name": "Goldman Sachs",
      "type": "financial",
      "importance": 0.9
    },
    {
      "id": "deutsche_bank",
      "name": "Deutsche Bank",
      "type": "financial",
      "importance": 0.8
    },
    {
      "id": "bsi_bank",
      "name": "BSI Bank",
      "type": "financial",
      "importance": 0.8
    },
    {
      "id": "bsi_bank_geneva",
      "name": "BSI Bank Geneva",
      "type": "financial",
      "importance": 0.7
    },
    {
      "id": "bsi_bank_lugano",
      "name": "BSI Bank Lugano",
      "type": "financial",
      "importance": 0.7
    },
    {
      "id": "falcon_private_bank",
      "name": "Falcon Private Bank",
      "type": "financial",
      "importance": 0.75
    },
    {
      "id": "standard_chartered",
      "name": "Standard Chartered Bank",
      "type": "financial",
      "importance": 0.75
    },
    {
      "id": "jp_morgan",
      "name": "J.P. Morgan",
      "type": "financial",
      "importance": 0.7
    },
    {
      "id": "jp_morgan_suisse",
      "name": "J.P. Morgan Suisse",
      "type": "financial",
      "importance": 0.65
    },
    {
      "id": "citibank",
      "name": "Citibank",
      "type": "financial",
      "importance": 0.65
    },
    {
      "id": "wells_fargo",
      "name": "Wells Fargo",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "ambank",
      "name": "AmBank Malaysia",
      "type": "financial",
      "importance": 0.7
    },
    {
      "id": "bank_negara",
      "name": "Bank Negara Malaysia",
      "type": "government",
      "importance": 0.7
    },
    {
      "id": "cimb_bank",
      "name": "CIMB Bank",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "bank_rothschild",
      "name": "Bank Rothschild Luxembourg",
      "type": "financial",
      "importance": 0.65
    },
    {
      "id": "rbs_coutts",
      "name": "RBS Coutts Singapore",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "ubs_singapore",
      "name": "UBS AG Singapore",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "dbs_bank",
      "name": "DBS Bank",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "bank_of_new_york_mellon",
      "name": "Bank of New York Mellon",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "ing_bank",
      "name": "ING Bank Amsterdam",
      "type": "financial",
      "importance": 0.5
    },
    {
      "id": "bhf_bank",
      "name": "BHF Bank Frankfurt",
      "type": "financial",
      "importance": 0.5
    },
    {
      "id": "bank_of_america",
      "name": "Bank of America Texas",
      "type": "financial",
      "importance": 0.5
    },
    {
      "id": "morgan_stanley",
      "name": "Morgan Stanley",
      "type": "financial",
      "importance": 0.6
    },
    {
      "id": "ipic",
      "name": "International Petroleum Investment Company (IPIC)",
      "type": "government",
      "importance": 0.8
    },
    {
      "id": "aabar",
      "name": "Aabar Investments",
      "type": "financial",
      "importance": 0.75
    },
    {
      "id": "us_doj",
      "name": "US Department of Justice",
      "type": "government",
      "importance": 0.7
    },
    {
      "id": "federal_election_commission",
      "name": "Federal Election Commission",
      "type": "government",
      "importance": 0.6
    },
    {
      "id": "us_district_court_dc",
      "name": "US District Court for District of Columbia",
      "type": "government",
      "importance": 0.6
    },
    {
      "id": "malaysian_anti_corruption",
      "name": "Malaysian Anti-Corruption Commission",
      "type": "government",
      "importance": 0.6
    },
    {
      "id": "umno",
      "name": "UMNO",
      "type": "organization",
      "importance": 0.6
    },
    {
      "id": "good_star",
      "name": "Good Star Limited",
      "type": "corporation",
      "importance": 0.75
    },
    {
      "id": "aabar_bvi",
      "name": "Aabar Investments PJS (BVI)",
      "type": "corporation",
      "importance": 0.8
    },
    {
      "id": "tanore_finance",
      "name": "Tanore Finance Corporation",
      "type": "corporation",
      "importance": 0.8
    },
    {
      "id": "blackstone_asia",
      "name": "Blackstone Asia Real Estate Partners",
      "type": "corporation",
      "importance": 0.7
    },
    {
      "id": "wynton_group",
      "name": "Wynton Group",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "jynwel_capital",
      "name": "Jynwel Capital",
      "type": "corporation",
      "importance": 0.65
    },
    {
      "id": "affinity_equity",
      "name": "Affinity Equity",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "alpha_synergy",
      "name": "Alpha Synergy",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "blackrock_commodities",
      "name": "Blackrock Commodities",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "brazen_sky",
      "name": "Brazen Sky",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "bridge_global_fund",
      "name": "Bridge Global Fund",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "enterprise_emerging_markets",
      "name": "Enterprise Emerging Markets Fund",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "cistenique_investment",
      "name": "Cistenique Investment Fund",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "vasco_investments",
      "name": "Vasco Investments Services SA",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "rayan_inc",
      "name": "Rayan Inc.",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "mb_consulting",
      "name": "MB Consulting LLC",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "foreign_fx_trading",
      "name": "Foreign FX Trading Limited",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "raffles_cash_exchange",
      "name": "Raffles Cash Exchange",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "amicorp_group",
      "name": "Amicorp Group",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "red_granite_pictures",
      "name": "Red Granite Pictures",
      "type": "corporation",
      "importance": 0.8
    },
    {
      "id": "strategic_hospitality",
      "name": "Strategic Hospitality",
      "type": "corporation",
      "importance": 0.65
    },
    {
      "id": "the_edge",
      "name": "The Edge",
      "type": "organization",
      "importance": 0.65
    },
    {
      "id": "sarawak_report",
      "name": "Sarawak Report",
      "type": "organization",
      "importance": 0.7
    },
    {
      "id": "emi_music",
      "name": "EMI Music Publishing",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "cinema_archives",
      "name": "Cinema Archives",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "star_newspaper",
      "name": "Star newspaper",
      "type": "organization",
      "importance": 0.4
    },
    {
      "id": "new_straits_times",
      "name": "New Straits Times",
      "type": "organization",
      "importance": 0.4
    },
    {
      "id": "shearman_sterling",
      "name": "Shearman & Sterling",
      "type": "corporation",
      "importance": 0.75
    },
    {
      "id": "christies_ny",
      "name": "Christie's New York",
      "type": "corporation",
      "importance": 0.7
    },
    {
      "id": "sothebys",
      "name": "Sotheby's",
      "type": "corporation",
      "importance": 0.65
    },
    {
      "id": "douglas_elliman",
      "name": "Douglas Elliman Real Estate",
      "type": "corporation",
      "importance": 0.55
    },
    {
      "id": "edelman_pr",
      "name": "Edelman PR",
      "type": "corporation",
      "importance": 0.55
    },
    {
      "id": "nksfb_accounting",
      "name": "NKSFB accounting",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "deloitte_malaysia",
      "name": "Deloitte Malaysia",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "kpmg",
      "name": "KPMG",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "white_case",
      "name": "White & Case",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "lazard",
      "name": "Lazard",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "marquee_nyc",
      "name": "Marquee New York",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "avenue_nyc",
      "name": "Avenue NYC",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "lavo_las_vegas",
      "name": "LAVO Las Vegas",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "tao_las_vegas",
      "name": "TAO Las Vegas",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "viceroy_hotels",
      "name": "Viceroy Hotel Group",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "les_caves_du_roy",
      "name": "Les Caves du Roy",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "hotel_byblos",
      "name": "Hotel Byblos",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "atlantis_palm",
      "name": "Atlantis, the Palm",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "clinique_la_prairie",
      "name": "Clinique La Prairie",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "plaza_athenee_bangkok",
      "name": "Plaza Athénée Bangkok",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "shangri_la_bangkok",
      "name": "Shangri-La Hotel Bangkok",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "harrow_school",
      "name": "Harrow School",
      "type": "organization",
      "importance": 0.5
    },
    {
      "id": "wharton_school",
      "name": "Wharton School",
      "type": "organization",
      "importance": 0.5
    },
    {
      "id": "georgetown_university",
      "name": "Georgetown University",
      "type": "organization",
      "importance": 0.5
    },
    {
      "id": "dusable_capital",
      "name": "DuSable Capital",
      "type": "corporation",
      "importance": 0.65
    },
    {
      "id": "black_men_vote",
      "name": "Black Men Vote",
      "type": "organization",
      "importance": 0.6
    },
    {
      "id": "md_anderson_cancer_center",
      "name": "MD Anderson Cancer Center",
      "type": "organization",
      "importance": 0.5
    },
    {
      "id": "angel_ball",
      "name": "Angel Ball",
      "type": "organization",
      "importance": 0.45
    },
    {
      "id": "ibm_watson",
      "name": "IBM Watson",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "petroSaudi",
      "name": "PetroSaudi International",
      "type": "corporation",
      "importance": 0.85
    },
    {
      "id": "equanimity_yacht",
      "name": "Equanimity (330-foot superyacht)",
      "type": "corporation",
      "importance": 0.7
    },
    {
      "id": "tatoosh_yacht",
      "name": "Tatoosh (303-foot superyacht)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "lady_catalina_yacht",
      "name": "Lady Catalina (160-foot yacht)",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "serene_yacht",
      "name": "Serene yacht (330-foot)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "luxury_yacht_300ft",
      "name": "300-foot luxury yacht ($142M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "alfa_nero_yacht",
      "name": "Alfa Nero",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "rm_elegant_yacht",
      "name": "RM Elegant",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "lermitage_beverly_hills",
      "name": "L'Ermitage Beverly Hills ($45M)",
      "type": "corporation",
      "importance": 0.65
    },
    {
      "id": "park_laurel_nyc",
      "name": "Park Laurel NYC ($36M penthouse)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "time_warner_penthouse",
      "name": "Time Warner Penthouse NYC ($30.5M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "pyramid_house_beverly_hills",
      "name": "Pyramid House Beverly Hills ($17.5M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "belgravia_townhouse",
      "name": "Belgravia London townhouse (£17M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "hillcrest_property_1",
      "name": "Hillcrest Property 1 Beverly Hills",
      "type": "corporation",
      "importance": 0.55
    },
    {
      "id": "oriole_mansion",
      "name": "Oriole Mansion Los Angeles",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "greene_condominium",
      "name": "Greene Condominium NYC",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "walker_tower_penthouse",
      "name": "Walker Tower Penthouse NYC",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "laurel_beverly_hills",
      "name": "Laurel Beverly Hills Mansion",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "qentas_townhouse",
      "name": "Qentas Townhouse London",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "stratton_penthouse",
      "name": "Stratton Penthouse London",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "stratton_flat",
      "name": "Stratton Flat London",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "stratton_office",
      "name": "Stratton Office Building London",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "one_madison_park",
      "name": "One Madison Park Condominium NYC",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "red_mountain_property",
      "name": "Red Mountain Property London",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "park_imperial_nyc",
      "name": "Park Imperial NYC ($100K/month suite)",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "kensington_green",
      "name": "Kensington Green London",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "basquiat_dustheads",
      "name": "Basquiat 'Dustheads' ($48.8M)",
      "type": "corporation",
      "importance": 0.65
    },
    {
      "id": "van_gogh_arles",
      "name": "Van Gogh 'La maison de Vincent a Arles' ($5.5M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "monet_saint_georges",
      "name": "Monet 'Saint-Georges Majeur'",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "monet_nympheas",
      "name": "Monet 'Nympheas' (€25.2M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "picasso_nature_morte",
      "name": "Picasso 'Nature Morte Au Crane De Taureau'",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "basquiat_redman_one",
      "name": "Basquiat 'Redman One' collage",
      "type": "corporation",
      "importance": 0.55
    },
    {
      "id": "diane_arbus_boy",
      "name": "Diane Arbus 'Boy With the Toy Hand Grenade'",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "rothko_yellow_blue",
      "name": "Rothko 'Untitled (Yellow and Blue)' ($71.6M)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "calder_tic_tac_toe",
      "name": "Calder 'Tic Tac Toe' ($3M)",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "calder_standing_mobile",
      "name": "Calder 'Untitled – Standing Mobile' ($5.4M)",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "mark_ryden_work",
      "name": "Mark Ryden work ($714K)",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "ed_ruscha_work",
      "name": "Ed Ruscha work ($367.5K)",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "lucio_fontana_work",
      "name": "Lucio Fontana 'Concetto spaziale, Attese'",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "bombardier_jet",
      "name": "Bombardier Jet N689WM",
      "type": "corporation",
      "importance": 0.55
    },
    {
      "id": "diamond_necklace",
      "name": "$27.3M Diamond Necklace (22-carat pink)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "wizard_of_oz_poster",
      "name": "$75K Wizard of Oz poster",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "movie_memorabilia",
      "name": "70+ movie memorabilia items ($4.29M)",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "daddys_home_rights",
      "name": "Daddy's Home rights",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "dumb_dumber_rights",
      "name": "Dumb and Dumber To rights",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "palantir_stock",
      "name": "Palantir Technologies stock",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "flywheel_shares",
      "name": "Flywheel shares",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "oceana_57_proceeds",
      "name": "Oceana 57 sale proceeds ($5.4M)",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "tanjong_energy",
      "name": "Tanjong Energy Holdings ($2.7B)",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "tanjong_power",
      "name": "Tanjong Power Holdings",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "genting_power",
      "name": "Genting Power Holdings Limited",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "rose_trading",
      "name": "Rose Trading",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "chanel",
      "name": "Chanel",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "tobey_maguire",
      "name": "Tobey Maguire",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "usher",
      "name": "Usher",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "jamie_foxx",
      "name": "Jamie Foxx",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "busta_rhymes",
      "name": "Busta Rhymes",
      "type": "person",
      "importance": 0.5
    },
    {
      "id": "muhyiddin_yassin",
      "name": "Muhyiddin Yassin",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "ahmad_husni",
      "name": "Ahmad Husni",
      "type": "person",
      "importance": 0.6
    },
    {
      "id": "irwan_serigar",
      "name": "Irwan Serigar",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "arul_kanda",
      "name": "Arul Kanda",
      "type": "person",
      "importance": 0.7
    },
    {
      "id": "maybank",
      "name": "Maybank",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "rhb_bank",
      "name": "RHB Bank",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "hong_leong_bank",
      "name": "Hong Leong Bank",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "affin_bank",
      "name": "Affin Bank",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "good_star_limited",
      "name": "Good Star Limited",
      "type": "corporation",
      "importance": 0.8
    },
    {
      "id": "aabar_investments_pjs",
      "name": "Aabar Investments PJS",
      "type": "corporation",
      "importance": 0.8
    },
    {
      "id": "blackstone_asia_real_estate",
      "name": "Blackstone Asia Real Estate",
      "type": "corporation",
      "importance": 0.7
    },
    {
      "id": "primero_company",
      "name": "Primero Company",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "granton_capital",
      "name": "Granton Capital",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "selune_holdings",
      "name": "Selune Holdings",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "acme_time",
      "name": "Acme Time",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "putrajaya_perdana",
      "name": "Putrajaya Perdana",
      "type": "corporation",
      "importance": 0.6
    },
    {
      "id": "warhol_campbells_soup",
      "name": "Warhol Campbell's Soup",
      "type": "asset",
      "importance": 0.6
    },
    {
      "id": "warhol_round_jackie",
      "name": "Warhol Round Jackie",
      "type": "asset",
      "importance": 0.6
    },
    {
      "id": "avenue_chelsea",
      "name": "Avenue Chelsea",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "palazzo_las_vegas",
      "name": "Palazzo Las Vegas",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "caesars_palace",
      "name": "Caesars Palace",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "four_seasons_whistler",
      "name": "Four Seasons Whistler",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "node_1",
      "name": "Metropolis Poster",
      "type": "financial",
      "importance": 0.5
    }
  ],
  "links": [
    {
      "source": "jho_low",
      "target": "najib_razak",
      "type": "Political corruption",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "jho_low",
      "target": "rosmah_mansor",
      "type": "Political corruption",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "jho_low",
      "target": "riza_aziz",
      "type": "Friendship/Business partner",
      "status": "confirmed",
      "date": "1998-2016"
    },
    {
      "source": "jho_low",
      "target": "khadem_al_qubaisi",
      "type": "Criminal conspiracy",
      "status": "confirmed",
      "date": "2012-2015"
    },
    {
      "source": "jho_low",
      "target": "mohamed_al_husseiny",
      "type": "Criminal conspiracy",
      "status": "confirmed",
      "date": "2012-2015"
    },
    {
      "source": "jho_low",
      "target": "timothy_leissner",
      "type": "Criminal conspiracy",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "jho_low",
      "target": "eric_tan",
      "type": "Business partner",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "jho_low",
      "target": "jasmine_loo",
      "type": "Business relationship",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "jho_low",
      "target": "pras_michel",
      "type": "Criminal conspiracy",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "jho_low",
      "target": "larry_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "low_taek_szen",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "goh_gaik_ewe",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "szen_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "may_lin_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "najib_razak",
      "target": "rosmah_mansor",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "najib_razak",
      "target": "riza_aziz",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "najib_razak",
      "target": "nazir_razak",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "najib_razak",
      "target": "norashman_najib",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "najib_razak",
      "target": "nooryana_najib",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "rosmah_mansor",
      "target": "riza_aziz",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "rosmah_mansor",
      "target": "nooryana_najib",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "rosmah_mansor",
      "target": "norashman_najib",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "tarek_obaid",
      "target": "nawaf_obaid",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "tarek_obaid",
      "target": "patrick_mahony",
      "type": "Business partner",
      "status": "confirmed",
      "date": "2005-2015"
    },
    {
      "source": "tarek_obaid",
      "target": "prince_turki",
      "type": "Royal connection",
      "status": "confirmed",
      "date": "2005-2015"
    },
    {
      "source": "tarek_obaid",
      "target": "xavier_justo",
      "type": "Former employee",
      "status": "confirmed",
      "date": "2009-2013"
    },
    {
      "source": "timothy_leissner",
      "target": "roger_ng",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "timothy_leissner",
      "target": "lloyd_blankfein",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "timothy_leissner",
      "target": "gary_cohn",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "timothy_leissner",
      "target": "michael_evans",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "roger_ng",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "lloyd_blankfein",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2006-2018"
    },
    {
      "source": "gary_cohn",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "1990-2017"
    },
    {
      "source": "michael_evans",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2016"
    },
    {
      "source": "andrea_vella",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2016"
    },
    {
      "source": "david_ryan",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2016"
    },
    {
      "source": "alex_turnbull",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2016"
    },
    {
      "source": "mark_schwartz",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2016"
    },
    {
      "source": "toby_watson",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2016"
    },
    {
      "source": "timothy_leissner",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "hanspeter_brunner",
      "target": "bsi_bank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "yak_yew_chee",
      "target": "bsi_bank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "alfredo_gysi",
      "target": "bsi_bank_lugano",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "yeo_jiawei",
      "target": "bsi_bank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "eduardo_leemann",
      "target": "falcon_private_bank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "joanna_yu",
      "target": "ambank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "cheah_tek_kuang",
      "target": "ambank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "singapore_banker_1",
      "target": "rbs_coutts",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "riza_aziz",
      "target": "red_granite_pictures",
      "type": "Control",
      "status": "confirmed",
      "date": "2010-2016"
    },
    {
      "source": "joey_mcfarland",
      "target": "red_granite_pictures",
      "type": "Employment",
      "status": "confirmed",
      "date": "2010-2016"
    },
    {
      "source": "leonardo_dicaprio",
      "target": "red_granite_pictures",
      "type": "Business relationship",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "martin_scorsese",
      "target": "red_granite_pictures",
      "type": "Business relationship",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "jordan_belfort",
      "target": "red_granite_pictures",
      "type": "Business relationship",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "noah_tepperberg",
      "target": "strategic_hospitality",
      "type": "Control",
      "status": "confirmed"
    },
    {
      "source": "jason_strauss",
      "target": "strategic_hospitality",
      "type": "Control",
      "status": "confirmed"
    },
    {
      "source": "strategic_hospitality",
      "target": "marquee_nyc",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "strategic_hospitality",
      "target": "avenue_nyc",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "strategic_hospitality",
      "target": "lavo_las_vegas",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "strategic_hospitality",
      "target": "tao_las_vegas",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "clare_rewcastle_brown",
      "target": "sarawak_report",
      "type": "Control",
      "status": "confirmed"
    },
    {
      "source": "tong_kooi_ong",
      "target": "the_edge",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "ho_kay_tat",
      "target": "the_edge",
      "type": "Publisher",
      "status": "confirmed"
    },
    {
      "source": "frank_white_jr",
      "target": "dusable_capital",
      "type": "Control",
      "status": "confirmed"
    },
    {
      "source": "shomik_dutta",
      "target": "morgan_stanley",
      "type": "Employment",
      "status": "former",
      "date": "2008-2012"
    },
    {
      "source": "denise_rich",
      "target": "angel_ball",
      "type": "Organizer",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "1mdb",
      "type": "Control",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "najib_razak",
      "target": "1mdb",
      "type": "Control",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "shahrol_halmi",
      "target": "1mdb",
      "type": "Employment",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "nik_faisal_ariff",
      "target": "1mdb",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "mohammed_bakke_salleh",
      "target": "1mdb",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2013"
    },
    {
      "source": "lodin_wok_kamaruddin",
      "target": "1mdb",
      "type": "Employment",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "jasmine_loo",
      "target": "1mdb",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "tarek_obaid",
      "target": "petroSaudi",
      "type": "Control",
      "status": "confirmed",
      "date": "2005-2015"
    },
    {
      "source": "patrick_mahony",
      "target": "petroSaudi",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "prince_turki",
      "target": "petroSaudi",
      "type": "Royal backing",
      "status": "confirmed",
      "date": "2005-2015"
    },
    {
      "source": "xavier_justo",
      "target": "petroSaudi",
      "type": "Employment",
      "status": "former",
      "date": "2009-2013"
    },
    {
      "source": "khadem_al_qubaisi",
      "target": "ipic",
      "type": "Employment",
      "status": "confirmed",
      "date": "2007-2015"
    },
    {
      "source": "crown_prince_mohammed",
      "target": "ipic",
      "type": "Control",
      "status": "confirmed",
      "date": "2015-present"
    },
    {
      "source": "mohamed_al_husseiny",
      "target": "aabar",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "khadem_al_qubaisi",
      "target": "falcon_private_bank",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "mohamed_al_husseiny",
      "target": "falcon_private_bank",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "jho_low",
      "target": "good_star",
      "type": "Control",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "eric_tan",
      "target": "aabar_bvi",
      "type": "Control",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "eric_tan",
      "target": "tanore_finance",
      "type": "Control",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "eric_tan",
      "target": "blackstone_asia",
      "type": "Control",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "jho_low",
      "target": "wynton_group",
      "type": "Control",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "jho_low",
      "target": "jynwel_capital",
      "type": "Control",
      "status": "confirmed",
      "date": "2012-2015"
    },
    {
      "source": "jho_low",
      "target": "equanimity_yacht",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2014-2018"
    },
    {
      "source": "jho_low",
      "target": "tatoosh_yacht",
      "type": "Charter",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "jho_low",
      "target": "lady_catalina_yacht",
      "type": "Charter",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "jho_low",
      "target": "bombardier_jet",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "rosmah_mansor",
      "target": "diamond_necklace",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "jho_low",
      "target": "basquiat_dustheads",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2013-2016"
    },
    {
      "source": "jho_low",
      "target": "van_gogh_arles",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2013-2016"
    },
    {
      "source": "jho_low",
      "target": "monet_saint_georges",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2013-2016"
    },
    {
      "source": "jho_low",
      "target": "picasso_nature_morte",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2013-2016"
    },
    {
      "source": "joey_mcfarland",
      "target": "basquiat_redman_one",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "wynton_group",
      "target": "lermitage_beverly_hills",
      "type": "Ownership",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "tom_barrack_jr",
      "target": "lermitage_beverly_hills",
      "type": "Seller",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "ian_schrager",
      "target": "lermitage_beverly_hills",
      "type": "Rival bidder",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "yousef_al_otaiba",
      "target": "lermitage_beverly_hills",
      "type": "Endorsement",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "viceroy_hotels",
      "target": "lermitage_beverly_hills",
      "type": "Rebranding partner",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "riza_aziz",
      "target": "park_laurel_nyc",
      "type": "Beneficiary",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "raphael_de_niro",
      "target": "park_laurel_nyc",
      "type": "Real estate agent",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "douglas_elliman",
      "target": "park_laurel_nyc",
      "type": "Brokerage",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "riza_aziz",
      "target": "pyramid_house_beverly_hills",
      "type": "Beneficiary",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "najib_razak",
      "target": "belgravia_townhouse",
      "type": "Family beneficiary",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "rosmah_mansor",
      "target": "belgravia_townhouse",
      "type": "Family beneficiary",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "rosmah_mansor",
      "target": "rose_trading",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2009-2010"
    },
    {
      "source": "rosmah_mansor",
      "target": "chanel",
      "type": "Luxury shopping",
      "status": "confirmed",
      "date": "2008-2015"
    },
    {
      "source": "danny_abeckaser",
      "target": "leonardo_dicaprio",
      "type": "Introduction",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "jho_low",
      "target": "paris_hilton",
      "type": "Social relationship",
      "status": "confirmed",
      "date": "2009-2012"
    },
    {
      "source": "jho_low",
      "target": "strategic_hospitality",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2009-2012"
    },
    {
      "source": "leonardo_dicaprio",
      "target": "marquee_nyc",
      "type": "Regular patron",
      "status": "confirmed",
      "date": "2009-2012"
    },
    {
      "source": "paris_hilton",
      "target": "marquee_nyc",
      "type": "Event performer",
      "status": "confirmed",
      "date": "2009-2012"
    },
    {
      "source": "danny_abeckaser",
      "target": "strategic_hospitality",
      "type": "Promoter relationship",
      "status": "confirmed",
      "date": "2009-2012"
    },
    {
      "source": "christies_ny",
      "target": "basquiat_dustheads",
      "type": "Auction services",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "christies_ny",
      "target": "van_gogh_arles",
      "type": "Auction services",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "christies_ny",
      "target": "monet_saint_georges",
      "type": "Auction services",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "sothebys",
      "target": "picasso_nature_morte",
      "type": "Auction services",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "sothebys",
      "target": "basquiat_redman_one",
      "type": "Auction services",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "eric_tan",
      "target": "christies_ny",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "joey_mcfarland",
      "target": "christies_ny",
      "type": "Authorized agent",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "jho_low",
      "target": "sothebys",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "jho_low",
      "target": "shearman_sterling",
      "type": "Legal services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "shearman_sterling",
      "target": "good_star",
      "type": "IOLTA services",
      "status": "confirmed",
      "date": "2009-2010"
    },
    {
      "source": "shearman_sterling",
      "target": "wynton_group",
      "type": "IOLTA services",
      "status": "confirmed",
      "date": "2009-2010"
    },
    {
      "source": "jp_morgan",
      "target": "christies_ny",
      "type": "Banking services",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "wells_fargo",
      "target": "ambank",
      "type": "Correspondent banking",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "citibank",
      "target": "standard_chartered",
      "type": "Correspondent banking",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "standard_chartered",
      "target": "blackstone_asia",
      "type": "Banking services",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "bank_rothschild",
      "target": "belgravia_townhouse",
      "type": "Financing services",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "douglas_elliman",
      "target": "time_warner_penthouse",
      "type": "Brokerage",
      "status": "confirmed"
    },
    {
      "source": "douglas_elliman",
      "target": "greene_condominium",
      "type": "Brokerage",
      "status": "confirmed"
    },
    {
      "source": "douglas_elliman",
      "target": "walker_tower_penthouse",
      "type": "Brokerage",
      "status": "confirmed"
    },
    {
      "source": "leonardo_dicaprio",
      "target": "basquiat_dustheads",
      "type": "Gift recipient",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "leonardo_dicaprio",
      "target": "picasso_nature_morte",
      "type": "Gift recipient",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "jho_low",
      "target": "lorraine_schwartz",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "lorraine_schwartz",
      "target": "diamond_necklace",
      "type": "Creator",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "najib_razak",
      "target": "ambank",
      "type": "Secret account holder",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "najib_razak",
      "target": "wells_fargo",
      "type": "Correspondent banking corruption",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "michael_evans",
      "target": "najib_razak",
      "type": "Davos meeting",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "joanna_yu",
      "target": "najib_razak",
      "type": "Secret account management",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "nazir_razak",
      "target": "cimb_bank",
      "type": "Employment",
      "status": "confirmed",
      "date": "2008-2015"
    },
    {
      "source": "cheah_tek_kuang",
      "target": "najib_razak",
      "type": "Secret account setup",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "norashman_najib",
      "target": "president_obama",
      "type": "White House meeting",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "mahathir_mohamad",
      "target": "najib_razak",
      "type": "Political opposition",
      "status": "confirmed",
      "date": "2015-2018"
    },
    {
      "source": "anwar_ibrahim",
      "target": "najib_razak",
      "type": "Political opposition",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "anwar_ibrahim",
      "target": "1mdb",
      "type": "Threat to close",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "tarek_obaid",
      "target": "jp_morgan_suisse",
      "type": "Payment recipient",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "tarek_obaid",
      "target": "najib_razak",
      "type": "Direct political contact",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "tarek_obaid",
      "target": "good_star",
      "type": "Theft coordination",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "patrick_mahony",
      "target": "xavier_justo",
      "type": "Death threat",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "patrick_mahony",
      "target": "1mdb",
      "type": "Oil refinery discussions",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "patrick_mahony",
      "target": "goldman_sachs",
      "type": "Employment",
      "status": "former",
      "date": "2005-2009"
    },
    {
      "source": "rosmah_mansor",
      "target": "pyramid_house_beverly_hills",
      "type": "Family beneficiary",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "rosmah_mansor",
      "target": "park_laurel_nyc",
      "type": "Family beneficiary",
      "status": "confirmed",
      "date": "2010"
    },
    {
      "source": "pras_michel",
      "target": "president_obama",
      "type": "Illegal campaign finance target",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "pras_michel",
      "target": "frank_white_jr",
      "type": "Political coordination",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "frank_white_jr",
      "target": "president_obama",
      "type": "Political access",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "ben_rhodes",
      "target": "president_obama",
      "type": "Employment",
      "status": "confirmed",
      "date": "2009-2017"
    },
    {
      "source": "pras_michel",
      "target": "dusable_capital",
      "type": "Political influence operation",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "pras_michel",
      "target": "black_men_vote",
      "type": "Political contribution",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "timothy_leissner",
      "target": "1mdb",
      "type": "Primary relationship manager",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "timothy_leissner",
      "target": "aabar_bvi",
      "type": "Bond theft vehicle",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "timothy_leissner",
      "target": "tanore_finance",
      "type": "Bond theft vehicle",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "roger_ng",
      "target": "timothy_leissner",
      "type": "Introduction to Low",
      "status": "confirmed",
      "date": "2009"
    },
    {
      "source": "khadem_al_qubaisi",
      "target": "good_star",
      "type": "Payment recipient",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "racem_haoues",
      "target": "khadem_al_qubaisi",
      "type": "Blackmail",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "crown_prince_mohammed",
      "target": "khadem_al_qubaisi",
      "type": "Ousted from IPIC",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "leonardo_dicaprio",
      "target": "riza_aziz",
      "type": "Wolf of Wall Street premiere",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "jho_low",
      "target": "riza_aziz",
      "type": "Kensington Green friendship",
      "status": "confirmed",
      "date": "1998-2000"
    },
    {
      "source": "jho_low",
      "target": "kensington_green",
      "type": "Early residence",
      "status": "confirmed",
      "date": "1998-2000"
    },
    {
      "source": "riza_aziz",
      "target": "kensington_green",
      "type": "Early residence",
      "status": "confirmed",
      "date": "1998-2000"
    },
    {
      "source": "denise_rich",
      "target": "jho_low",
      "type": "Angel Ball attendance",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "denise_rich",
      "target": "leonardo_dicaprio",
      "type": "Celebrity charity circuit",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "shomik_dutta",
      "target": "president_obama",
      "type": "White House special assistant",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "shomik_dutta",
      "target": "frank_white_jr",
      "type": "Political network",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "edelman_pr",
      "target": "jho_low",
      "type": "Reputation management client",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "edelman_pr",
      "target": "1mdb",
      "type": "Reputation management",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "md_anderson_cancer_center",
      "target": "jho_low",
      "type": "Charitable pledge recipient",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "md_anderson_cancer_center",
      "target": "1mdb",
      "type": "Stolen funds pledge",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "md_anderson_cancer_center",
      "target": "ibm_watson",
      "type": "Cancer diagnosis project",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "plaza_athenee_bangkok",
      "target": "xavier_justo",
      "type": "Whistleblower meeting venue",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "plaza_athenee_bangkok",
      "target": "clare_rewcastle_brown",
      "type": "Data transfer meeting",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "plaza_athenee_bangkok",
      "target": "the_edge",
      "type": "Media investigation coordination",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "pras_michel",
      "target": "us_doj",
      "type": "Criminal prosecution",
      "status": "confirmed",
      "date": "2019"
    },
    {
      "source": "jho_low",
      "target": "us_doj",
      "type": "Criminal prosecution",
      "status": "confirmed",
      "date": "2016"
    },
    {
      "source": "1mdb",
      "target": "goldman_sachs",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "1mdb",
      "target": "deutsche_bank",
      "type": "Client relationship",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "1mdb",
      "target": "petroSaudi",
      "type": "Joint venture",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "1mdb",
      "target": "ipic",
      "type": "Guarantee relationship",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "good_star",
      "target": "petroSaudi",
      "type": "Theft vehicle",
      "status": "confirmed",
      "date": "2009-2011"
    },
    {
      "source": "aabar_bvi",
      "target": "goldman_sachs",
      "type": "Theft vehicle",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "tanore_finance",
      "target": "goldman_sachs",
      "type": "Theft vehicle",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "miranda_kerr",
      "target": "jho_low",
      "type": "Romance",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "miranda_kerr",
      "target": "lorraine_schwartz",
      "type": "Business relationship",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "miranda_kerr",
      "target": "equanimity_yacht",
      "type": "Romance venue",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "jho_low",
      "target": "harrow_school",
      "type": "Education",
      "status": "confirmed",
      "date": "1995-1998"
    },
    {
      "source": "jho_low",
      "target": "wharton_school",
      "type": "Education",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "riza_aziz",
      "target": "harrow_school",
      "type": "Education",
      "status": "confirmed",
      "date": "1995-1998"
    },
    {
      "source": "hamad_al_wazzan",
      "target": "wharton_school",
      "type": "Education",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "seet_li_lin",
      "target": "wharton_school",
      "type": "Education",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "ivanka_trump",
      "target": "wharton_school",
      "type": "Education",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "jho_low",
      "target": "hamad_al_wazzan",
      "type": "Wharton classmate",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "jho_low",
      "target": "seet_li_lin",
      "type": "Wharton classmate",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "jho_low",
      "target": "ivanka_trump",
      "type": "Wharton classmate",
      "status": "confirmed",
      "date": "1998-2005"
    },
    {
      "source": "paul_allen",
      "target": "tatoosh_yacht",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "tanjong_energy",
      "type": "Investment target",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "jho_low",
      "target": "tanjong_power",
      "type": "Investment target",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "ananda_krishnan",
      "target": "tanjong_energy",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "ananda_krishnan",
      "target": "tanjong_power",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "lady_gaga",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "snoop_dogg",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "dr_dre",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "beyonce",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "jay_z",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "kanye_west",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "swizz_beatz",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "alicia_keys",
      "target": "jho_low",
      "type": "Performance for",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "kate_upton",
      "target": "jho_low",
      "type": "Party guest",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "bradley_cooper",
      "target": "jho_low",
      "type": "Party guest",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "bar_refaeli",
      "target": "jho_low",
      "type": "Party guest",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "kristen_wiig",
      "target": "jho_low",
      "type": "Party guest",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "jon_hamm",
      "target": "jho_low",
      "type": "Party guest",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "ot_genasis",
      "target": "jho_low",
      "type": "Witness to spending",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "lindsay_lohan",
      "target": "jho_low",
      "type": "Gift recipient",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "kristal_fox",
      "target": "miranda_kerr",
      "type": "Publicist",
      "status": "confirmed",
      "date": "2014-2015"
    },
    {
      "source": "abdul_gani_patail",
      "target": "najib_razak",
      "type": "Government official",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "abdul_gani_patail",
      "target": "1mdb",
      "type": "Legal oversight",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "bank_negara",
      "target": "najib_razak",
      "type": "Central bank oversight",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "bank_negara",
      "target": "1mdb",
      "type": "Regulatory oversight",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "federal_election_commission",
      "target": "pras_michel",
      "type": "Investigation",
      "status": "confirmed",
      "date": "2017-2019"
    },
    {
      "source": "federal_election_commission",
      "target": "president_obama",
      "type": "Campaign finance oversight",
      "status": "confirmed",
      "date": "2012-2016"
    },
    {
      "source": "malaysian_anti_corruption",
      "target": "najib_razak",
      "type": "Investigation",
      "status": "confirmed",
      "date": "2015-2018"
    },
    {
      "source": "malaysian_anti_corruption",
      "target": "1mdb",
      "type": "Corruption investigation",
      "status": "confirmed",
      "date": "2015-2018"
    },
    {
      "source": "us_district_court_dc",
      "target": "us_doj",
      "type": "Legal proceedings",
      "status": "confirmed",
      "date": "2016-2019"
    },
    {
      "source": "us_district_court_dc",
      "target": "pras_michel",
      "type": "Criminal trial",
      "status": "confirmed",
      "date": "2019"
    },
    {
      "source": "umno",
      "target": "najib_razak",
      "type": "Political party",
      "status": "confirmed",
      "date": "2009-2018"
    },
    {
      "source": "umno",
      "target": "rosmah_mansor",
      "type": "Political party",
      "status": "confirmed",
      "date": "2009-2018"
    },
    {
      "source": "affinity_equity",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "alpha_synergy",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "blackrock_commodities",
      "target": "jho_low",
      "type": "Fake shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "brazen_sky",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "bridge_global_fund",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "cistenique_investment",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "enterprise_emerging_markets",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "vasco_investments",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "rayan_inc",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "mb_consulting",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "foreign_fx_trading",
      "target": "eric_tan",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "bank_of_america",
      "target": "blackstone_asia",
      "type": "Banking services",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "bank_of_new_york_mellon",
      "target": "falcon_private_bank",
      "type": "Correspondent banking",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "bank_of_new_york_mellon",
      "target": "1mdb",
      "type": "Wire transfer services",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "ubs_singapore",
      "target": "aabar_bvi",
      "type": "Fake account services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "ubs_singapore",
      "target": "deutsche_bank",
      "type": "Loan theft processing",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "dbs_bank",
      "target": "jho_low",
      "type": "Banking services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "ing_bank",
      "target": "tanore_finance",
      "type": "Correspondent banking",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "ing_bank",
      "target": "enterprise_emerging_markets",
      "type": "Account services",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "ing_bank",
      "target": "cistenique_investment",
      "type": "Account services",
      "status": "confirmed",
      "date": "2012-2013"
    },
    {
      "source": "bhf_bank",
      "target": "jho_low",
      "type": "Banking services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "bsi_bank_geneva",
      "target": "bsi_bank",
      "type": "Branch",
      "status": "confirmed"
    },
    {
      "source": "calder_standing_mobile",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "calder_tic_tac_toe",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "diane_arbus_boy",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "ed_ruscha_work",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "lucio_fontana_work",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "mark_ryden_work",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "monet_nympheas",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "rothko_yellow_blue",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "movie_memorabilia",
      "target": "riza_aziz",
      "type": "Collectible purchases",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "wizard_of_oz_poster",
      "target": "riza_aziz",
      "type": "Collectible purchase",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "alfa_nero_yacht",
      "target": "jho_low",
      "type": "Yacht charter",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "serene_yacht",
      "target": "jho_low",
      "type": "Yacht charter",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "rm_elegant_yacht",
      "target": "jho_low",
      "type": "Yacht charter",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "luxury_yacht_300ft",
      "target": "jho_low",
      "type": "Yacht purchase",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "hillcrest_property_1",
      "target": "jho_low",
      "type": "Real estate investment",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "laurel_beverly_hills",
      "target": "wynton_group",
      "type": "Real estate investment",
      "status": "confirmed",
      "date": "2011"
    },
    {
      "source": "one_madison_park",
      "target": "jho_low",
      "type": "NYC property",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "park_imperial_nyc",
      "target": "jho_low",
      "type": "NYC residence",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "qentas_townhouse",
      "target": "jho_low",
      "type": "London property",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "red_mountain_property",
      "target": "jho_low",
      "type": "London property",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "stratton_flat",
      "target": "jho_low",
      "type": "London property",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "stratton_office",
      "target": "jho_low",
      "type": "London property",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "stratton_penthouse",
      "target": "jho_low",
      "type": "London property",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "oriole_mansion",
      "target": "jho_low",
      "type": "Los Angeles property",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "cinema_archives",
      "target": "riza_aziz",
      "type": "Movie memorabilia services",
      "status": "confirmed",
      "date": "2013-2014"
    },
    {
      "source": "deloitte_malaysia",
      "target": "1mdb",
      "type": "Auditing services",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "kpmg",
      "target": "1mdb",
      "type": "Auditing services",
      "status": "confirmed",
      "date": "2009-2013"
    },
    {
      "source": "nksfb_accounting",
      "target": "riza_aziz",
      "type": "Accounting services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "lazard",
      "target": "1mdb",
      "type": "Financial advisory",
      "status": "former",
      "date": "2014-2015"
    },
    {
      "source": "white_case",
      "target": "petroSaudi",
      "type": "Legal services",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "amicorp_group",
      "target": "jho_low",
      "type": "Corporate services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "emi_music",
      "target": "jho_low",
      "type": "Asset purchase",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "daddys_home_rights",
      "target": "red_granite_pictures",
      "type": "Film rights",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "dumb_dumber_rights",
      "target": "red_granite_pictures",
      "type": "Film rights",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "new_straits_times",
      "target": "najib_razak",
      "type": "Media support",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "star_newspaper",
      "target": "najib_razak",
      "type": "Media support",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "palantir_stock",
      "target": "tarek_obaid",
      "type": "Investment",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "flywheel_shares",
      "target": "riza_aziz",
      "type": "Investment",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "oceana_57_proceeds",
      "target": "jho_low",
      "type": "Asset sale",
      "status": "confirmed",
      "date": "2014"
    },
    {
      "source": "atlantis_palm",
      "target": "jho_low",
      "type": "Entertainment venue",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "hotel_byblos",
      "target": "jho_low",
      "type": "Accommodation",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "les_caves_du_roy",
      "target": "jho_low",
      "type": "Entertainment venue",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "clinique_la_prairie",
      "target": "jho_low",
      "type": "Spa services",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "shangri_la_bangkok",
      "target": "patrick_mahony",
      "type": "Threat meeting venue",
      "status": "confirmed",
      "date": "2015"
    },
    {
      "source": "david_cameron",
      "target": "najib_razak",
      "type": "Government relations",
      "status": "confirmed",
      "date": "2013-2015"
    },
    {
      "source": "laura_justo",
      "target": "xavier_justo",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "sheikh_mansour",
      "target": "khadem_al_qubaisi",
      "type": "Business relationship",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "sheikh_mansour",
      "target": "timothy_leissner",
      "type": "Business meeting",
      "status": "confirmed",
      "date": "2012"
    },
    {
      "source": "sheikh_mansour",
      "target": "crown_prince_mohammed",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "winston_fisher",
      "target": "jho_low",
      "type": "Real estate network",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "georgetown_university",
      "target": "shomik_dutta",
      "type": "Education",
      "status": "confirmed",
      "date": "2004-2008"
    },
    {
      "source": "raffles_cash_exchange",
      "target": "jho_low",
      "type": "Money exchange services",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "genting_power",
      "target": "ananda_krishnan",
      "type": "Ownership",
      "status": "confirmed"
    },
    {
      "source": "lloyd_blankfein",
      "target": "goldman_sachs",
      "type": "CEO",
      "status": "confirmed",
      "date": "2006-2018"
    },
    {
      "source": "gary_cohn",
      "target": "goldman_sachs",
      "type": "President",
      "status": "confirmed",
      "date": "2009-2017"
    },
    {
      "source": "michael_evans",
      "target": "goldman_sachs",
      "type": "Vice President",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "andrea_vella",
      "target": "goldman_sachs",
      "type": "Structured Finance",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "david_ryan",
      "target": "goldman_sachs",
      "type": "Asia President",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "alex_turnbull",
      "target": "goldman_sachs",
      "type": "Hong Kong banker",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "mark_schwartz",
      "target": "goldman_sachs",
      "type": "Veteran banker",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "toby_watson",
      "target": "goldman_sachs",
      "type": "PFI desk head",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "larry_low",
      "target": "jho_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "low_taek_szen",
      "target": "jho_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "goh_gaik_ewe",
      "target": "jho_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "szen_low",
      "target": "jho_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "may_lin_low",
      "target": "jho_low",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "nazir_razak",
      "target": "najib_razak",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "norashman_najib",
      "target": "najib_razak",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "nooryana_najib",
      "target": "najib_razak",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "nawaf_obaid",
      "target": "tarek_obaid",
      "type": "Family",
      "status": "confirmed"
    },
    {
      "source": "hanspeter_brunner",
      "target": "bsi_bank",
      "type": "Regional chief",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "yak_yew_chee",
      "target": "bsi_bank",
      "type": "Private banker",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "alfredo_gysi",
      "target": "bsi_bank",
      "type": "Lugano CEO",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "hanspeter_brunner",
      "target": "jho_low",
      "type": "Banking services",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "yak_yew_chee",
      "target": "jho_low",
      "type": "Private banking",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "noah_tepperberg",
      "target": "strategic_hospitality",
      "type": "Co-founder",
      "status": "confirmed"
    },
    {
      "source": "jason_strauss",
      "target": "strategic_hospitality",
      "type": "Co-founder",
      "status": "confirmed"
    },
    {
      "source": "danny_abeckaser",
      "target": "jho_low",
      "type": "Club promoter",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "tobey_maguire",
      "target": "jho_low",
      "type": "Entertainment",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "usher",
      "target": "jho_low",
      "type": "Entertainment",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "jamie_foxx",
      "target": "jho_low",
      "type": "Entertainment",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "ot_genasis",
      "target": "jho_low",
      "type": "Entertainment",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "busta_rhymes",
      "target": "jho_low",
      "type": "Entertainment",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "lindsay_lohan",
      "target": "jho_low",
      "type": "Entertainment",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "muhyiddin_yassin",
      "target": "najib_razak",
      "type": "Government",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "ahmad_husni",
      "target": "1mdb",
      "type": "Board member",
      "status": "confirmed",
      "date": "2009-2015"
    },
    {
      "source": "irwan_serigar",
      "target": "1mdb",
      "type": "Treasury Secretary-General",
      "status": "confirmed",
      "date": "2009-2016"
    },
    {
      "source": "arul_kanda",
      "target": "1mdb",
      "type": "CEO",
      "status": "confirmed",
      "date": "2015-2018"
    },
    {
      "source": "shahrol_halmi",
      "target": "1mdb",
      "type": "Former CEO",
      "status": "confirmed",
      "date": "2009-2013"
    },
    {
      "source": "good_star_limited",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2009-2013"
    },
    {
      "source": "aabar_investments_pjs",
      "target": "khadem_al_qubaisi",
      "type": "Fake entity",
      "status": "confirmed",
      "date": "2012-2015"
    },
    {
      "source": "blackstone_asia_real_estate",
      "target": "jho_low",
      "type": "Investment vehicle",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "primero_company",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "granton_capital",
      "target": "jho_low",
      "type": "Shell company",
      "status": "confirmed",
      "date": "2012-2014"
    },
    {
      "source": "van_gogh_arles",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "monet_saint_georges",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "picasso_nature_morte",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "warhol_campbells_soup",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "warhol_round_jackie",
      "target": "jho_low",
      "type": "Art purchase",
      "status": "confirmed",
      "date": "2013"
    },
    {
      "source": "marquee_nyc",
      "target": "jho_low",
      "type": "Entertainment venue",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "avenue_chelsea",
      "target": "jho_low",
      "type": "Entertainment venue",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "lavo_las_vegas",
      "target": "jho_low",
      "type": "Entertainment venue",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "tao_las_vegas",
      "target": "jho_low",
      "type": "Entertainment venue",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "palazzo_las_vegas",
      "target": "jho_low",
      "type": "Gambling venue",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "caesars_palace",
      "target": "jho_low",
      "type": "Gambling venue",
      "status": "confirmed",
      "date": "2009-2014"
    },
    {
      "source": "selune_holdings",
      "target": "jho_low",
      "type": "Beneficial Owner",
      "status": "confirmed"
    },
    {
      "source": "riza_aziz",
      "target": "node_1",
      "type": "Owner",
      "status": "confirmed"
    },
    {
      "source": "xavier_justo",
      "target": "clare_rewcastle_brown",
      "type": "Source",
      "status": "confirmed"
    },
    {
      "source": "rbs_coutts",
      "target": "jho_low",
      "type": "Used this Bank",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "putrajaya_perdana",
      "type": "Beneficial Owner",
      "status": "confirmed"
    },
    {
      "source": "jho_low",
      "target": "viceroy_hotels",
      "type": "Beneficial Owner",
      "status": "confirmed"
    },
    {
      "source": "1mdb",
      "target": "rhb_bank",
      "type": "Transaction",
      "status": "confirmed"
    }
  ]
}

// BCCI Network
window.silentPartners.initialData.bcci = {
  "title": "BCCI Network - Banco Nazionale del Lavoro, Reagan, Bush, Thatcher, and the Arming of Iraq (1979-1990)",
  "description": "Comprehensive network of financial and political connections involving BCCI, government officials, and international arms dealing from the Lombardi Networks dataset",
  "nodes": [
    {
      "id": "9772",
      "name": "[2]",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9770",
      "name": "91/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9767",
      "name": "89/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9764",
      "name": "87/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "889",
      "name": "Agha Hasan Abedi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9759",
      "name": "Jean-Luc Lagadere",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9756",
      "name": "Car and Driver",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9754",
      "name": "Woman's Day",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9751",
      "name": "Hachette Livres - Paris -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9749",
      "name": "Ohanes Awanes Artin",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9747",
      "name": "Bruno Buhler",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9745",
      "name": "AHA Turnkey Projects - Vienna -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9743",
      "name": "Mowafak Abdul Karim",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9737",
      "name": "Midis Fin - Geneva -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9734",
      "name": "Mohammed Habib",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9731",
      "name": "Khalaf al-Doulimi",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9729",
      "name": "Montana Mgmt - Panama -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9727",
      "name": "Aladine Hussein Khamas",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9725",
      "name": "Barzan al-Tikriti dir Iraqi Intelligence gov Kuwait 1990-1",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "356",
      "name": "?",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9721",
      "name": "Khairallah al-Tulfah",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9718",
      "name": "BAII",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9715",
      "name": "1st City Bk - Houston -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9713",
      "name": "Marshall Wiley US amb to Oman 1979-81",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9710",
      "name": "Richard Murphy dep asst sec US State dept",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9707",
      "name": "Richard Fairbanks US amb",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9705",
      "name": "US-Iraq Business Forum - Houston -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9702",
      "name": "Paul Hastings Janofsky - DC -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9701",
      "name": "James Plache dep US embassy Riyadh",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9699",
      "name": "Nizar Hamdoon Iraq amb to UN",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9697",
      "name": "Tarik Aziz foreign min",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9695",
      "name": "Foreign Min/2",
      "type": "government",
      "importance": 0.3
    },
    {
      "id": "9693",
      "name": "86/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9691",
      "name": "85/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9688",
      "name": "83/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "2283",
      "name": "84/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9685",
      "name": "Abdul M. Rasheed",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9682",
      "name": "Jasim Khalaf",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9680",
      "name": "Addulwalad Toma",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9678",
      "name": "Rafidain Bank - Baghdad -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9676",
      "name": "Iraq Central Bank",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9673",
      "name": "Sadik Taha",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "2265",
      "name": "81/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9668",
      "name": "Gov't of Iraq",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9666",
      "name": "Micro Tech & Comp - Austin -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9664",
      "name": "1998: Atlanta Ga branch raided by FBI; 1991: US atty files charges against bank officials & clients; US House Banking Comm open hearings on bank; US taxpayers forfeit $ 370 mil",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "9662",
      "name": "1991: Italian Senate opens probe of bank; recommends indictments; Italian taxpayers forfeit $ 400 mil",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "3803",
      "name": "(o)",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9658",
      "name": "Nash Rehmann",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2317",
      "name": "90/3",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9655",
      "name": "Richard Thornburgh atty gen US 1988-91",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9653",
      "name": "Assoc Inst Dists - Ga -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9651",
      "name": "William Newlin",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9649",
      "name": "John Mitchell atty gen US 1969-72",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9647",
      "name": "Col. Jack Brennan",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9645",
      "name": "Global Research Assocs - DC -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9643",
      "name": "Pathlite - Tenn -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9641",
      "name": "Spiro Agnew vp US 1969-73",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9639",
      "name": "Pan East - Tenn -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9637",
      "name": "Nicolae Ceaucescu pres Romania 1965-89",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9634",
      "name": "Pan Aviation - Miami -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9632",
      "name": "Sir Derek Alun-Jones",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9630",
      "name": "Ferranti - London -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9628",
      "name": "Citicorp - NY -",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "9626",
      "name": "Saudi joint venture",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9624",
      "name": "Roger Darman dir OMB 1989-93 dep sec US Treasury 1985-7",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9622",
      "name": "James A. Baker III US sec State 1989-92 US sec Treas 1985-8",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9620",
      "name": "Carlyle Group - DC -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9618",
      "name": "Frank Carlucci US sec Defense 1987-9 NSC 1986-7 dep dir CIA 1978-81",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9616",
      "name": "Wackenhut Corp - Fl -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9614",
      "name": "Westmark Systems - Austin -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9611",
      "name": "Bobby Ray Inman dep dir CIA 1981-2 dir NSA 1977-81",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9609",
      "name": "Worldwide Assocs",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9607",
      "name": "Gen. Alexander Haig cmdr NATO 1979-81 US sec State 1981-2",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9605",
      "name": "Gen. Barry Shillito",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9603",
      "name": "1992: raided by US Costums; forfeited $ 8.6 mil",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9601",
      "name": "Swissco Dev. - Miami -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9599",
      "name": "1992-3: indicted in US for arms smuggling & money laundering",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "3278",
      "name": "Carlos Cardoen",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "3237",
      "name": "Augusto Giangrandini",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9595",
      "name": "James Theberge US amb to Chile 1982-5 CIA Panel 1986-7",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9593",
      "name": "Juan Valdevieso",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "3236",
      "name": "Carlos Schurmann",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "3235",
      "name": "Nasser Beydoun",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9585",
      "name": "Int'l Signal & Control - Pa -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9583",
      "name": "P.W. Botha pres So Africa 1984-9 PM 1978-84",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9581",
      "name": "Gamma Systems - Jamaica NY -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9579",
      "name": "Gov't of South Africa",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9577",
      "name": "1991: indicted in US for arms smuggling",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "740",
      "name": "Claude Ivy",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9573",
      "name": "1991: indicted in US for fraud & arms smuggling; plead guilty; sentenced to 15 yrs",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9571",
      "name": "Ayatollah Ruhallah Khomeini r. Iran 1979-89",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2698",
      "name": "Gov't of Iran",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9568",
      "name": "John Major PM UK 1990-",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9566",
      "name": "Margaret Thatcher PM UK 1979-90",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9564",
      "name": "Alan Clark",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9562",
      "name": "UK Gov't",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9560",
      "name": "Norman Lamont",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9558",
      "name": "Defense Min/2",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9554",
      "name": "Gerard Heneghean",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "728",
      "name": "James Guerin",
      "type": "person",
      "importance": 0.3
    },
    {
      "id": "241",
      "name": "Terry Byrne",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9550",
      "name": "Luchaire - Paris -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9548",
      "name": "Int'l Military Services",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9546",
      "name": "George (Lord) Younger",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9544",
      "name": "Royal Bank of Scotland",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9541",
      "name": "Gary Kauf",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9537",
      "name": "Iraqi uniform deal",
      "type": "government",
      "importance": 0.3
    },
    {
      "id": "9535",
      "name": "Armscor - Pretoria -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9533",
      "name": "Allivane - Glasgow -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9531",
      "name": "Saudi Int'l Bank",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9529",
      "name": "Ameer Saadi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9527",
      "name": "Matra",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9525",
      "name": "MBB",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9523",
      "name": "90/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9520",
      "name": "covert weapons projects",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "9518",
      "name": "Christopher Cowley",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9516",
      "name": "Alex Pappas",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9514",
      "name": "Tom McCann",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9512",
      "name": "Stephan Kock",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2069",
      "name": "Chris Gumbley",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9508",
      "name": "Astra Holding - London -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9507",
      "name": "Sir Gerald James",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9505",
      "name": "Astra Defense Systems",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9503",
      "name": "Jean Duronsoy",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9501",
      "name": "88/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9499",
      "name": "1991: indicted in US for fraud & conspiracy",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9497",
      "name": "Daimler Benz - Stuttgart -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9495",
      "name": "Adel al-Alami",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9493",
      "name": "Raja Hasan Ali",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9491",
      "name": "1995: defected to Jordan 1996 murdered upon return to Baghdad",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9489",
      "name": "Saddam Hussein pres Iraq 1979-",
      "type": "government",
      "importance": 0.3
    },
    {
      "id": "9486",
      "name": "Hussein Kamel dir Min of Industry and Military Industrialization",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9484",
      "name": "Fadel Kadhum",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9482",
      "name": "Namir al-Naimi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9480",
      "name": "Learfan - Belfast -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9477",
      "name": "Anees M. Wadi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2108",
      "name": "Roy Ricks",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9473",
      "name": "Safa al-Habobi",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9469",
      "name": "TDG - London -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9467",
      "name": "Al Araby Trading - Baghdad -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9465",
      "name": "Robert Koshaba",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9463",
      "name": "1990: raided by UK customs police; charges later dismissed",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9460",
      "name": "Paul Henderson",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9458",
      "name": "Mark Gutteridge",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9456",
      "name": "Abdul Qaddumi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9454",
      "name": "1990: seized in US; assets forteited",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9452",
      "name": "Dan Quayle vp US 1989-93",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "1274",
      "name": "Beurt Servaas",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9448",
      "name": "Kennametal - Latrobe Fla -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9446",
      "name": "Gordon Cooper",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9443",
      "name": "Roland Davis",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9441",
      "name": "Richard Kendrick",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9439",
      "name": "Bill Muscarella",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9437",
      "name": "XYZ Options - Alabama -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9435",
      "name": "Salim Naman",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9433",
      "name": "1991: indicted in US for arms smuggling; convicted; sentenced to 4 yrs",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9431",
      "name": "Sarkis Saghanalian",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9429",
      "name": "Umberto D'Addosio",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "1268",
      "name": "Servaas Inc. - Indiana -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9426",
      "name": "Matrix Churchill US - Ohio -",
      "type": "government",
      "importance": 0.4
    },
    {
      "id": "9424",
      "name": "CE Kintex - Sofia -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9422",
      "name": "Stroock Stroock Lavan - NY -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9420",
      "name": "Mela Maggi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9417",
      "name": "Dale Toler",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9415",
      "name": "RD&D - Va -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9413",
      "name": "1991: murdered in Brussels by unknown assailants",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9411",
      "name": "Gerald Bull",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9409",
      "name": "Matrix Churchill UK - Coventry -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9407",
      "name": "Ind. Cardoen - Chile -",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "9405",
      "name": "Rexon Tech - NJ -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9403",
      "name": "ATI Belgique - Brussels -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9401",
      "name": "PRB - Brussels -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9399",
      "name": "SRC Composite - London -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9396",
      "name": "Paragon Holding - Panama -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9391",
      "name": "SRC Eng - London -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9389",
      "name": "Lloyd's Bank Int'l - London -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9387",
      "name": "1991: convicted in UK; sentenced to 5 yrs",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9385",
      "name": "Ali Daghir",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9383",
      "name": "Euromac UK - London -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9381",
      "name": "1989: raided by Italian police",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9379",
      "name": "SRC Corp - Brussels -",
      "type": "financial",
      "importance": 0.5
    },
    {
      "id": "9377",
      "name": "1989: indicted in Italy; charges later dismissed",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9375",
      "name": "Kassim Abbas",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9373",
      "name": "TMG Eng - Baghdad -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9371",
      "name": "Euromac - Monza -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9368",
      "name": "Dow Chemical",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9365",
      "name": "Arbed Steel - Lux -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9362",
      "name": "Foodline Corp",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "9361",
      "name": "Cecil Phillips",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9359",
      "name": "Pacific Export",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9355",
      "name": "Delft Insts - Neth -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9351",
      "name": "Hussein Zeineddine",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9349",
      "name": "Int'l Trading Group - Paris -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9347",
      "name": "Hughes Aircraft - Calif -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9345",
      "name": "General Motors - Detroit -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9343",
      "name": "Thomsen CSF - Paris -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9340",
      "name": "Rinaldo Petrignani Italian amb to US",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9338",
      "name": "William P. Rogers US sec State 1969-73",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9335",
      "name": "Casper Weinberger US sec Defense 1981-7",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9332",
      "name": "ASEA Brown Boveri",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9328",
      "name": "George Shultz US sec State 1982-9 US sec Treas 1972-4",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9326",
      "name": "proposed PC 2 plant",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9323",
      "name": "Bechtel Corp - SF -",
      "type": "financial",
      "importance": 0.3
    },
    {
      "id": "9321",
      "name": "Lummus Crest - NJ -",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9319",
      "name": "MIMI",
      "type": "corporation",
      "importance": 0.5
    },
    {
      "id": "9317",
      "name": "proposed pipeline project",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9315",
      "name": "Ahmed Bennani",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9312",
      "name": "Patain - Paris -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9310",
      "name": "Therese Barden",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9308",
      "name": "Jean Ivey",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9306",
      "name": "Raytheon",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9304",
      "name": "R.J. Reynolds",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9302",
      "name": "Nestle S.A. - Switz -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9300",
      "name": "Hussein Juma",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9298",
      "name": "UBAF - Paris -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9295",
      "name": "Intermaritime Bank - Geneva -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "2337",
      "name": "Union Bank of Switz",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "9291",
      "name": "Azizullah Chaudhury",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9289",
      "name": "Alfred Hartmann",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9285",
      "name": "Franz Maissen",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9283",
      "name": "Banque de Comm & Place - Geneva -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9281",
      "name": "Thes. Cont'l - Geneva -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9278",
      "name": "Mehmet Karamehmet",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9276",
      "name": "Engin Bora",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9273",
      "name": "Cukarona Group - Istanbul -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9271",
      "name": "Enza Parzalama",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9269",
      "name": "1991: indicted in US for bank fraud",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "9267",
      "name": "Yavuz Tezeller",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9265",
      "name": "Enka Holdings",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9263",
      "name": "Cargill Comas - Miami -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9261",
      "name": "plead guilty to export-related charges; paid $ 1 mil fine",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9258",
      "name": "Robert Abboud",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9256",
      "name": "Nat. Bank of Georgia - Atlanta -",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "886",
      "name": "Ghaith Pharaon",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9253",
      "name": "1991: US indictments blocked by State dept",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9251",
      "name": "Wafaj Dajani",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "2285",
      "name": "86/2",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9247",
      "name": "Fadhil al-Marsoumi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9243",
      "name": "Comet Rice - Houston -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9241",
      "name": "Iraq grain trade",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9239",
      "name": "Amman Resources - Jordan -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9237",
      "name": "Gearbulk - Norway -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9235",
      "name": "Louis Dreyfus - NY -",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9232",
      "name": "joint venture - Aqaba -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9229",
      "name": "Cont'l Grain - NY -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9227",
      "name": "Leigh Ann New",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2312",
      "name": "89/3",
      "type": "organization",
      "importance": 0.4
    },
    {
      "id": "2304",
      "name": "88/3",
      "type": "organization",
      "importance": 0.6
    },
    {
      "id": "9220",
      "name": "87/3",
      "type": "organization",
      "importance": 0.4
    },
    {
      "id": "2287",
      "name": "86/3",
      "type": "organization",
      "importance": 0.4
    },
    {
      "id": "9216",
      "name": "Araba Holdings - Aqaba -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9214",
      "name": "Lewis Preston",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9212",
      "name": "Morgan Guaranty - NY -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9208",
      "name": "Paul von Wedel",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2307",
      "name": "84/3",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9204",
      "name": "1991: indicted in US on 347 counts of bank fraud; plead guilty to 60 counts; later reneged on deal; plead guilty to 7 counts; sentenced to 3 years",
      "type": "financial",
      "importance": 0.1
    },
    {
      "id": "9202",
      "name": "Lux bank account",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "243",
      "name": "Christopher Drogoul",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9199",
      "name": "83/3",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9197",
      "name": "Rogers and Wells - NY -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9195",
      "name": "Bruce Rappaport",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9193",
      "name": "Commodity Credit Corp",
      "type": "financial",
      "importance": 0.4
    },
    {
      "id": "9191",
      "name": "John Block sec 1981-6",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9189",
      "name": "Robert Mosbacher sec 1989-92",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9187",
      "name": "Commerce dept",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9185",
      "name": "Agriculture dept",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9183",
      "name": "William Casey dir CIA 1981-7 chmn SEC 1973-4",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9181",
      "name": "Ronald Reagan pres US 1981-9",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9179",
      "name": "George Bush vp US 1981-9 pres US 1989-93",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9177",
      "name": "US Gov't",
      "type": "government",
      "importance": 0.3
    },
    {
      "id": "9175",
      "name": "Maxwell Rabb US amb to Italy 1981-9",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9173",
      "name": "Guiseppe Vincenzino",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9171",
      "name": "Lavoro Bank - Switz -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9169",
      "name": "Ademaro Lanzara",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9167",
      "name": "Gianipiero Cantoni",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "1079",
      "name": "[1]",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9164",
      "name": "1988: convicted in US for fraud & money laundering; paid fine",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9162",
      "name": "Entrade Int'l - NY -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "2310",
      "name": "85/3",
      "type": "organization",
      "importance": 0.5
    },
    {
      "id": "9159",
      "name": "Cafa Baga",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9157",
      "name": "Goran Gazivoda",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9154",
      "name": "Rinato Gundagnini",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9152",
      "name": "Vinko Mir",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9150",
      "name": "BCCI S.A.",
      "type": "financial",
      "importance": 0.4
    },
    {
      "id": "9147",
      "name": "Ljubljanska Banka - Yugo -",
      "type": "financial",
      "importance": 0.2
    },
    {
      "id": "9145",
      "name": "LBS Bank - NY -",
      "type": "financial",
      "importance": 0.4
    },
    {
      "id": "9143",
      "name": "Lawrence Eagleburger US sec of State 1992-3",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "2262",
      "name": "83/2",
      "type": "organization",
      "importance": 0.3
    },
    {
      "id": "9140",
      "name": "Carlo Salvatore",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9138",
      "name": "Paolo Savona",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9136",
      "name": "Roberto di Nisio",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "2259",
      "name": "82/2",
      "type": "organization",
      "importance": 0.3
    },
    {
      "id": "9132",
      "name": "Int'l Six - DC -",
      "type": "corporation",
      "importance": 0.1
    },
    {
      "id": "9130",
      "name": "Brent Scowcroft NSC 1989-93",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9128",
      "name": "Henry Kissinger US sec of State 1973-7; NSC 1969-73",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9126",
      "name": "Alan Stoga",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9124",
      "name": "Kissinger Assocs - NY -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9122",
      "name": "Gianni Agnelli",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "1875",
      "name": "1989: forced to resign post",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "3247",
      "name": "Nerio Nesi",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "1782",
      "name": "Mario Fallani",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9117",
      "name": "81/2",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9115",
      "name": "Casalee - Lux -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "1785",
      "name": "Count Ferdinando Borletti",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9110",
      "name": "Fiat - Turin -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "2282",
      "name": "82/1",
      "type": "organization",
      "importance": 0.2
    },
    {
      "id": "9107",
      "name": "Banca Nazionale del Lavoro - Atlanta -",
      "type": "corporation",
      "importance": 0.3
    },
    {
      "id": "9105",
      "name": "Pietro Lombardi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9103",
      "name": "Louis Messere",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9101",
      "name": "Quirino di Mano",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9099",
      "name": "Carlo Vecchi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9097",
      "name": "Vito Cannito",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9095",
      "name": "Teodoro Monaco",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9093",
      "name": "1989: forced to resign post; 1991: indicted in Italy for fraud",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "171",
      "name": "Giacomo Pedde",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "9090",
      "name": "Mario Girotti",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9088",
      "name": "David Croffe",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9086",
      "name": "Valsella Mech - Brescia -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9084",
      "name": "Amer Rashid al-Ubeidi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9081",
      "name": "1988: raided by Italian police",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9079",
      "name": "Paimpex",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9077",
      "name": "Adnan Khairallah defense min",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9075",
      "name": "1993: indicted in Italy for criminal conspiracy 1995: indicted for murder",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9073",
      "name": "Giulio Andreotti PM Italy 1972-3, 1976-9, 1989-91; foreign min 1983-9",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9071",
      "name": "1993: indicted in Italy for fraud & corruption 1994: convicted; sentenced to 8 yrs fled to Tunisia",
      "type": "organization",
      "importance": 0.1
    },
    {
      "id": "9069",
      "name": "Foreign Min",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9067",
      "name": "Benito Craxi PM Italy 1983-7",
      "type": "person",
      "importance": 0.2
    },
    {
      "id": "2679",
      "name": "80/2",
      "type": "organization",
      "importance": 0.3
    },
    {
      "id": "9064",
      "name": "BNL No. Amer - NY -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9062",
      "name": "Francesco Bignardi",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9059",
      "name": "Gov't of Italy",
      "type": "government",
      "importance": 0.2
    },
    {
      "id": "9057",
      "name": "Lamberto Dini PM Italy 1995-6",
      "type": "government",
      "importance": 0.1
    },
    {
      "id": "9055",
      "name": "Guido Carli",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9053",
      "name": "Treasury Min",
      "type": "government",
      "importance": 0.3
    },
    {
      "id": "9051",
      "name": "SACE",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9049",
      "name": "Defense Min",
      "type": "government",
      "importance": 0.3
    },
    {
      "id": "9046",
      "name": "Fincant Riuniti Navali - Genua -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9044",
      "name": "Oto Melara - La Spezia -",
      "type": "corporation",
      "importance": 0.2
    },
    {
      "id": "9042",
      "name": "Paolo de Vito",
      "type": "person",
      "importance": 0.1
    },
    {
      "id": "9040",
      "name": "Banca Nazionale del Lavoro - Rome -",
      "type": "corporation",
      "importance": 0.4
    },
    {
      "id": "9039",
      "name": "Alberto Ferrari",
      "type": "person",
      "importance": 0.1
    }
  ],
  "links": [
    {
      "source": "9770",
      "target": "9772",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9767",
      "target": "9523",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9764",
      "target": "9501",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "889",
      "target": "9150",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9759",
      "target": "9527",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9759",
      "target": "9751",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9751",
      "target": "9527",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9751",
      "target": "9756",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9751",
      "target": "9754",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9749",
      "target": "9737",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9747",
      "target": "9737",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9743",
      "target": "9745",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9743",
      "target": "9729",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9737",
      "target": "9497",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9737",
      "target": "9751",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9734",
      "target": "9737",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9734",
      "target": "9729",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9731",
      "target": "9737",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9731",
      "target": "9729",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9729",
      "target": "9737",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9727",
      "target": "9737",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9727",
      "target": "9729",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9725",
      "target": "9734",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9725",
      "target": "9731",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9725",
      "target": "9727",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9721",
      "target": "356",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9718",
      "target": "9150",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9718",
      "target": "9715",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9713",
      "target": "9705",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9710",
      "target": "9715",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9710",
      "target": "9705",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9707",
      "target": "9705",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9707",
      "target": "9702",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9701",
      "target": "9702",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9699",
      "target": "9695",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9697",
      "target": "9695",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9695",
      "target": "9705",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9695",
      "target": "9702",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9693",
      "target": "9764",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9691",
      "target": "9693",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9688",
      "target": "2283",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2283",
      "target": "9691",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2283",
      "target": "9676",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9685",
      "target": "9676",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9682",
      "target": "9678",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9680",
      "target": "9678",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9676",
      "target": "9678",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9673",
      "target": "9676",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2265",
      "target": "2282",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9668",
      "target": "2265",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9668",
      "target": "1079",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9664",
      "target": "3803",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9662",
      "target": "3803",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9658",
      "target": "9653",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2317",
      "target": "3803",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2317",
      "target": "9653",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9653",
      "target": "9448",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9651",
      "target": "9655",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9651",
      "target": "9448",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9649",
      "target": "9645",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9647",
      "target": "9645",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9645",
      "target": "9537",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9641",
      "target": "9643",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9639",
      "target": "9641",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9639",
      "target": "9537",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9637",
      "target": "9537",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9632",
      "target": "9630",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9630",
      "target": "9585",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9628",
      "target": "9626",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9624",
      "target": "9620",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9622",
      "target": "9620",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9620",
      "target": "9626",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9618",
      "target": "9620",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9618",
      "target": "9616",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9611",
      "target": "9666",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9611",
      "target": "9616",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9611",
      "target": "9614",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9611",
      "target": "9585",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9607",
      "target": "9609",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9607",
      "target": "9585",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9605",
      "target": "9585",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9603",
      "target": "9601",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9599",
      "target": "3278",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "3278",
      "target": "9601",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "3278",
      "target": "9407",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "3237",
      "target": "9407",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9595",
      "target": "9407",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9593",
      "target": "9407",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "3236",
      "target": "9407",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "3235",
      "target": "9407",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9585",
      "target": "9581",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9585",
      "target": "9407",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9583",
      "target": "9579",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9579",
      "target": "9581",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9579",
      "target": "9535",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9577",
      "target": "9585",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9577",
      "target": "740",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "740",
      "target": "9535",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9573",
      "target": "728",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9571",
      "target": "2698",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9568",
      "target": "9562",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9566",
      "target": "9562",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9564",
      "target": "9562",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9562",
      "target": "9558",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9560",
      "target": "9558",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9558",
      "target": "9548",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9554",
      "target": "9533",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "728",
      "target": "9585",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "728",
      "target": "740",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "728",
      "target": "9554",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "728",
      "target": "241",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "241",
      "target": "9533",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9550",
      "target": "2698",
      "type": "Connection",
      "status": "confirmed"
    },
    {
      "source": "9546",
      "target": "9544",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9544",
      "target": "9533",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9541",
      "target": "9405",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9533",
      "target": "9550",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9533",
      "target": "9548",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9533",
      "target": "9405",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9531",
      "target": "9533",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9531",
      "target": "9520",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9529",
      "target": "9520",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9527",
      "target": "9520",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9525",
      "target": "9520",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9523",
      "target": "9770",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9523",
      "target": "9520",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9520",
      "target": "9533",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9520",
      "target": "9407",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9520",
      "target": "9537",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9520",
      "target": "9535",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9518",
      "target": "9403",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9516",
      "target": "9403",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9514",
      "target": "9505",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9512",
      "target": "9505",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2069",
      "target": "9508",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9508",
      "target": "9505",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9507",
      "target": "9508",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9505",
      "target": "9520",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9505",
      "target": "9401",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9503",
      "target": "9401",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9501",
      "target": "9767",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9501",
      "target": "9319",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9499",
      "target": "9673",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9499",
      "target": "9473",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9497",
      "target": "9525",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9495",
      "target": "9319",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9493",
      "target": "9319",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9491",
      "target": "9486",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9489",
      "target": "9725",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9489",
      "target": "9721",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9489",
      "target": "9673",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9489",
      "target": "2265",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9489",
      "target": "9486",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9486",
      "target": "9319",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9486",
      "target": "9484",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9484",
      "target": "9467",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9482",
      "target": "9399",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9477",
      "target": "9469",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2108",
      "target": "9469",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9473",
      "target": "9469",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9473",
      "target": "9467",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9469",
      "target": "9399",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9469",
      "target": "9373",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9467",
      "target": "9469",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9467",
      "target": "9373",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9465",
      "target": "9373",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9463",
      "target": "9409",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9460",
      "target": "9409",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9458",
      "target": "9409",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9456",
      "target": "9409",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9454",
      "target": "9426",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9452",
      "target": "1274",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "1274",
      "target": "1268",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9448",
      "target": "9407",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9448",
      "target": "9426",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9446",
      "target": "9426",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9443",
      "target": "9426",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9441",
      "target": "9437",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9439",
      "target": "9437",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9437",
      "target": "9426",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9435",
      "target": "9426",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9433",
      "target": "9431",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9431",
      "target": "9537",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9431",
      "target": "9634",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9429",
      "target": "2312",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9426",
      "target": "1268",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9420",
      "target": "2304",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9417",
      "target": "9415",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9413",
      "target": "9411",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9411",
      "target": "9431",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9411",
      "target": "9379",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9409",
      "target": "9407",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9409",
      "target": "9426",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9403",
      "target": "9520",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9399",
      "target": "9480",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9396",
      "target": "9379",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9389",
      "target": "9391",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9387",
      "target": "9385",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9385",
      "target": "9383",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9381",
      "target": "9371",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9409",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9407",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9405",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9403",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9401",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9399",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9379",
      "target": "9391",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9377",
      "target": "9375",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9375",
      "target": "9371",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9373",
      "target": "9409",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9373",
      "target": "9379",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9373",
      "target": "9391",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9371",
      "target": "9383",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9371",
      "target": "9379",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9371",
      "target": "9373",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9365",
      "target": "9359",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9361",
      "target": "9359",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9361",
      "target": "9362",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9351",
      "target": "9349",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9347",
      "target": "9355",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9345",
      "target": "9347",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9340",
      "target": "9197",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9338",
      "target": "9197",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9335",
      "target": "9197",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9335",
      "target": "9323",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9332",
      "target": "9321",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9328",
      "target": "9323",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9323",
      "target": "9326",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9323",
      "target": "9321",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9323",
      "target": "9317",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9321",
      "target": "9326",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9321",
      "target": "9317",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9497",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9467",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9368",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9359",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9355",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9345",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9326",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9319",
      "target": "9317",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9315",
      "target": "9298",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9312",
      "target": "9298",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9310",
      "target": "2287",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9308",
      "target": "2287",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9300",
      "target": "9298",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9298",
      "target": "9150",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2337",
      "target": "9281",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9291",
      "target": "9283",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9289",
      "target": "9295",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9289",
      "target": "9171",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9289",
      "target": "9283",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9285",
      "target": "9283",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9281",
      "target": "9283",
      "type": "Sale/Transfer",
      "status": "confirmed"
    },
    {
      "source": "9278",
      "target": "9273",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9276",
      "target": "9271",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9273",
      "target": "9283",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9273",
      "target": "9281",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9273",
      "target": "9150",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9273",
      "target": "9265",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9271",
      "target": "9202",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9269",
      "target": "9267",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9267",
      "target": "9162",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9265",
      "target": "9271",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9265",
      "target": "9162",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9263",
      "target": "9162",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9261",
      "target": "9162",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9258",
      "target": "9715",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9258",
      "target": "9705",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "886",
      "target": "9150",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "886",
      "target": "9258",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "886",
      "target": "9256",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "886",
      "target": "9251",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9253",
      "target": "9251",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9251",
      "target": "9239",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2285",
      "target": "9241",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9247",
      "target": "9241",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9243",
      "target": "9232",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9241",
      "target": "9162",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9241",
      "target": "9232",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9241",
      "target": "9216",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9239",
      "target": "9232",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9239",
      "target": "9216",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9237",
      "target": "9216",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9227",
      "target": "2310",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2312",
      "target": "2317",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2312",
      "target": "1268",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2312",
      "target": "9426",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2312",
      "target": "9424",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9422",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "2312",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9415",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9379",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9389",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9371",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9368",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9359",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "9197",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "2304",
      "target": "2312",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9220",
      "target": "9349",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9220",
      "target": "9347",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9220",
      "target": "9345",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9220",
      "target": "9343",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9220",
      "target": "9323",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9220",
      "target": "2304",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2287",
      "target": "9312",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2287",
      "target": "9306",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2287",
      "target": "9304",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2287",
      "target": "9302",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2287",
      "target": "9220",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9214",
      "target": "9212",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9212",
      "target": "9216",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9208",
      "target": "2307",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2307",
      "target": "2310",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9204",
      "target": "243",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9202",
      "target": "243",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "243",
      "target": "9107",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9199",
      "target": "2307",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9195",
      "target": "9317",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9195",
      "target": "9295",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "2312",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "2304",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "9220",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "2287",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "9212",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "2310",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9193",
      "target": "2307",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9191",
      "target": "9185",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9189",
      "target": "9187",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9185",
      "target": "9193",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9183",
      "target": "9197",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9183",
      "target": "9195",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9183",
      "target": "9177",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9181",
      "target": "9177",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9179",
      "target": "9177",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9177",
      "target": "9187",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9177",
      "target": "9185",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9175",
      "target": "9177",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9173",
      "target": "9175",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9173",
      "target": "9107",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9169",
      "target": "2262",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9167",
      "target": "2262",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9164",
      "target": "9145",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "9235",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "9162",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "9232",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "9216",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "9229",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "2287",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2310",
      "target": "9145",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9159",
      "target": "9145",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9157",
      "target": "9145",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9154",
      "target": "2262",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9154",
      "target": "9145",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9152",
      "target": "9145",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9150",
      "target": "9729",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9150",
      "target": "356",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9150",
      "target": "9283",
      "type": "Sale/Transfer",
      "status": "confirmed"
    },
    {
      "source": "9150",
      "target": "9124",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9147",
      "target": "9145",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9147",
      "target": "9124",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9145",
      "target": "9162",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9143",
      "target": "9145",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9143",
      "target": "9124",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2262",
      "target": "9171",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2262",
      "target": "1079",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9140",
      "target": "2259",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9138",
      "target": "2259",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9136",
      "target": "2259",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2259",
      "target": "2262",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2259",
      "target": "9124",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9130",
      "target": "9132",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9130",
      "target": "9124",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9128",
      "target": "9124",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9126",
      "target": "9124",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9122",
      "target": "9110",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "1875",
      "target": "3247",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "3247",
      "target": "9117",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "1782",
      "target": "9115",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9117",
      "target": "2259",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9117",
      "target": "9115",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9115",
      "target": "9086",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "1785",
      "target": "9110",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "1785",
      "target": "1785",
      "type": "Related to",
      "status": "confirmed"
    },
    {
      "source": "1785",
      "target": "9086",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9110",
      "target": "9124",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9110",
      "target": "9086",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "2282",
      "target": "9695",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2282",
      "target": "9688",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "2282",
      "target": "9049",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9107",
      "target": "9678",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9107",
      "target": "9199",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9105",
      "target": "9064",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9103",
      "target": "9064",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9101",
      "target": "9064",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9099",
      "target": "9064",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9097",
      "target": "9064",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9095",
      "target": "2679",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9093",
      "target": "171",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "171",
      "target": "2679",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9090",
      "target": "2679",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9088",
      "target": "2679",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9084",
      "target": "9049",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9081",
      "target": "9079",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9077",
      "target": "9049",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9075",
      "target": "9073",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9073",
      "target": "9069",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9071",
      "target": "9067",
      "type": "Final Connection",
      "status": "confirmed"
    },
    {
      "source": "9067",
      "target": "9059",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "2679",
      "target": "9079",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9064",
      "target": "9107",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9062",
      "target": "9040",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9059",
      "target": "9069",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9059",
      "target": "9053",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9057",
      "target": "9053",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9055",
      "target": "9053",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9053",
      "target": "9040",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9053",
      "target": "9051",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9051",
      "target": "9040",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9049",
      "target": "9086",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9049",
      "target": "9079",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9049",
      "target": "9046",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9044",
      "target": "9046",
      "type": "Association",
      "status": "confirmed"
    },
    {
      "source": "9042",
      "target": "9040",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9040",
      "target": "2679",
      "type": "Timeline",
      "status": "confirmed"
    },
    {
      "source": "9040",
      "target": "9064",
      "type": "Influence/Control",
      "status": "confirmed"
    },
    {
      "source": "9040",
      "target": "9046",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9040",
      "target": "9044",
      "type": "Financial Transaction",
      "status": "confirmed"
    },
    {
      "source": "9039",
      "target": "9040",
      "type": "Influence/Control",
      "status": "confirmed"
    }
  ]
}

// Jeffrey Epstein Network
window.silentPartners.initialData.epstein = {
    "title": "Jeffrey Epstein Criminal Network",
    "description": "Comprehensive network analysis of Jeffrey Epstein's documented relationships and associations with enhanced logical connections",
    "nodes": [
        {
            "id": "node_1",
            "name": "Jeffrey Epstein",
            "type": "person",
            "importance": 1.0
        },
        {
            "id": "node_2",
            "name": "Ghislaine Maxwell",
            "type": "person",
            "importance": 0.9
        },
        {
            "id": "node_3",
            "name": "Leslie Wexner",
            "type": "person",
            "importance": 0.9
        },
        {
            "id": "node_4",
            "name": "Prince Andrew",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_5",
            "name": "Bill Clinton",
            "type": "person",
            "importance": 0.9
        },
        {
            "id": "node_6",
            "name": "Donald Trump",
            "type": "person",
            "importance": 0.9
        },
        {
            "id": "node_7",
            "name": "Alan Dershowitz",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_8",
            "name": "Virginia Giuffre",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_9",
            "name": "Johanna Sjoberg",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_10",
            "name": "Jean-Luc Brunel",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_11",
            "name": "Mark Epstein",
            "type": "person",
            "importance": 0.4
        },
        {
            "id": "node_12",
            "name": "Alan Greenberg",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_13",
            "name": "Jimmy Cayne",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_14",
            "name": "Edgar Bronfman",
            "type": "person",
            "importance": 0.5
        },
        {
            "id": "node_15",
            "name": "Steven Hoffenberg",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_16",
            "name": "Alexander Acosta",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_17",
            "name": "Adnan Khashoggi",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_18",
            "name": "Harvey Weinstein",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_19",
            "name": "Michael Jackson",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_20",
            "name": "David Copperfield",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_21",
            "name": "Stephen Hawking",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_22",
            "name": "Juan Alessi",
            "type": "person",
            "importance": 0.5
        },
        {
            "id": "node_23",
            "name": "Alfredo Rodriguez",
            "type": "person",
            "importance": 0.5
        },
        {
            "id": "node_24",
            "name": "Bear Stearns",
            "type": "financial",
            "importance": 0.8
        },
        {
            "id": "node_25",
            "name": "J. Epstein & Company",
            "type": "corporation",
            "importance": 0.8
        },
        {
            "id": "node_26",
            "name": "Intercontinental Assets Group",
            "type": "corporation",
            "importance": 0.7
        },
        {
            "id": "node_27",
            "name": "Financial Trust Company",
            "type": "corporation",
            "importance": 0.7
        },
        {
            "id": "node_28",
            "name": "Liquid Funding Ltd",
            "type": "financial",
            "importance": 0.6
        },
        {
            "id": "node_29",
            "name": "L Brands",
            "type": "corporation",
            "importance": 0.8
        },
        {
            "id": "node_30",
            "name": "Victoria's Secret",
            "type": "corporation",
            "importance": 0.7
        },
        {
            "id": "node_31",
            "name": "Towers Financial Corporation",
            "type": "corporation",
            "importance": 0.6
        },
        {
            "id": "node_32",
            "name": "Wexner Foundation",
            "type": "organization",
            "importance": 0.6
        },
        {
            "id": "node_33",
            "name": "Dalton School",
            "type": "organization",
            "importance": 0.6
        },
        {
            "id": "node_34",
            "name": "Epstein Manhattan Townhouse",
            "type": "organization",
            "importance": 0.8
        },
        {
            "id": "node_35",
            "name": "Palm Beach Mansion",
            "type": "organization",
            "importance": 0.8
        },
        {
            "id": "node_36",
            "name": "Virgin Islands Properties",
            "type": "organization",
            "importance": 0.8
        },
        {
            "id": "node_37",
            "name": "New Mexico Ranch",
            "type": "organization",
            "importance": 0.6
        },
        {
            "id": "node_38",
            "name": "U.S. Attorney Southern District of Florida",
            "type": "government",
            "importance": 0.6
        },
        {
            "id": "node_39",
            "name": "Cooper Union",
            "type": "organization",
            "importance": 0.4
        },
        {
            "id": "node_40",
            "name": "New York University",
            "type": "organization",
            "importance": 0.4
        },
        {
            "id": "node_41",
            "name": "Lafayette High School",
            "type": "organization",
            "importance": 0.3
        },
        {
            "id": "node_42",
            "name": "Harvard Law School",
            "type": "organization",
            "importance": 0.5
        },
        {
            "id": "node_43",
            "name": "Mar-a-Lago Club",
            "type": "organization",
            "importance": 0.6
        },
        {
            "id": "node_44",
            "name": "Trump Atlantic City Casino",
            "type": "organization",
            "importance": 0.4
        },
        {
            "id": "node_45",
            "name": "Villard Houses",
            "type": "organization",
            "importance": 0.5
        },
        {
            "id": "node_46",
            "name": "New York Magazine",
            "type": "corporation",
            "importance": 0.5
        },
        {
            "id": "node_47",
            "name": "Radar Magazine",
            "type": "corporation",
            "importance": 0.5
        },
        {
            "id": "node_48",
            "name": "Standard & Poor's",
            "type": "financial",
            "importance": 0.4
        },
        {
            "id": "node_49",
            "name": "Fitch Ratings",
            "type": "financial",
            "importance": 0.4
        },
        {
            "id": "node_50",
            "name": "Moody's Investors Service",
            "type": "financial",
            "importance": 0.4
        },
        {
            "id": "node_51",
            "name": "D.B. Zwirn Special Opportunities Fund",
            "type": "financial",
            "importance": 0.5
        },
        {
            "id": "node_52",
            "name": "Fortress Investment Group",
            "type": "financial",
            "importance": 0.5
        },
        {
            "id": "node_53",
            "name": "Seagram Company",
            "type": "corporation",
            "importance": 0.5
        },
        {
            "id": "node_54",
            "name": "Pan American World Airways",
            "type": "corporation",
            "importance": 0.4
        },
        {
            "id": "node_55",
            "name": "Emery Air Freight Corp",
            "type": "corporation",
            "importance": 0.4
        },
        {
            "id": "node_56",
            "name": "Old National Bancorp",
            "type": "financial",
            "importance": 0.4
        },
        {
            "id": "node_57",
            "name": "New Albany, Ohio",
            "type": "organization",
            "importance": 0.4
        },
        {
            "id": "node_58",
            "name": "Sea Gate, Brooklyn",
            "type": "organization",
            "importance": 0.4
        },
        {
            "id": "node_59",
            "name": "Interlochen Center for the Arts",
            "type": "organization",
            "importance": 0.3
        },
        {
            "id": "node_60",
            "name": "Pauline Stolofsky",
            "type": "person",
            "importance": 0.3
        },
        {
            "id": "node_61",
            "name": "Seymour George Epstein",
            "type": "person",
            "importance": 0.3
        },
        {
            "id": "node_62",
            "name": "Donald Barr",
            "type": "person",
            "importance": 0.5
        },
        {
            "id": "node_63",
            "name": "John Mitchell",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_64",
            "name": "Ana Obregón",
            "type": "person",
            "importance": 0.4
        },
        {
            "id": "node_65",
            "name": "Jane Doe #3",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_66",
            "name": "Mortimer Zuckerman",
            "type": "person",
            "importance": 0.6
        },
        {
            "id": "node_67",
            "name": "Maer Roshan",
            "type": "person",
            "importance": 0.4
        },
        {
            "id": "node_68",
            "name": "JPMorgan Chase",
            "type": "financial",
            "importance": 1.0
        },
        {
            "id": "node_69",
            "name": "Deutsche Bank",
            "type": "financial",
            "importance": 0.9
        },
        {
            "id": "node_70",
            "name": "HSBC Private Bank (Suisse) SA",
            "type": "financial",
            "importance": 0.7
        },
        {
            "id": "node_71",
            "name": "David Boies",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_72",
            "name": "Sigrid McCawley",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_73",
            "name": "Geoffrey Berman",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_74",
            "name": "Boies Schiller Flexner LLP",
            "type": "organization",
            "importance": 0.7
        },
        {
            "id": "node_75",
            "name": "U.S. Attorney's Office SDNY",
            "type": "government",
            "importance": 0.8
        },
        {
            "id": "node_76",
            "name": "Julie K. Brown",
            "type": "person",
            "importance": 0.9
        },
        {
            "id": "node_77",
            "name": "Michael Reiter",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_78",
            "name": "Miami Herald",
            "type": "organization",
            "importance": 0.7
        },
        {
            "id": "node_79",
            "name": "FBI New York Field Office",
            "type": "government",
            "importance": 0.8
        },
        {
            "id": "node_80",
            "name": "Palm Beach Police Department",
            "type": "government",
            "importance": 0.7
        },
        {
            "id": "node_81",
            "name": "Little Saint James Island",
            "type": "property",
            "importance": 1.0
        },
        {
            "id": "node_82",
            "name": "Great Saint James Island",
            "type": "property",
            "importance": 0.8
        },
        {
            "id": "node_83",
            "name": "Lolita Express",
            "type": "property",
            "importance": 0.9
        },
        {
            "id": "node_84",
            "name": "Paris Apartment",
            "type": "property",
            "importance": 0.6
        },
        {
            "id": "node_85",
            "name": "Nadia Marcinkova",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_86",
            "name": "Sarah Kellen",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_87",
            "name": "Glenn Dubin",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_88",
            "name": "Eva Andersson-Dubin",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_89",
            "name": "Reid Hoffman",
            "type": "person",
            "importance": 0.8
        },
        {
            "id": "node_90",
            "name": "Marvin Minsky",
            "type": "person",
            "importance": 0.7
        },
        {
            "id": "node_91",
            "name": "Larry Summers",
            "type": "person",
            "importance": 0.8
        }
    ],
    "links": [
        {
            "source": "node_1",
            "target": "node_11",
            "type": "family",
            "status": "suspected",
            "date": "1953-2019"
        },
        {
            "source": "node_1",
            "target": "node_2",
            "type": "criminal_accomplice",
            "status": "confirmed",
            "date": "1990s-2019"
        },
        {
            "source": "node_1",
            "target": "node_3",
            "type": "client_advisor",
            "status": "confirmed",
            "date": "1986-2019"
        },
        {
            "source": "node_1",
            "target": "node_4",
            "type": "social_criminal",
            "status": "confirmed",
            "date": "2000s-2010s"
        },
        {
            "source": "node_1",
            "target": "node_5",
            "type": "social_political",
            "status": "confirmed",
            "date": "2000s-2010s"
        },
        {
            "source": "node_1",
            "target": "node_6",
            "type": "social",
            "status": "confirmed",
            "date": "1990s-2000s"
        },
        {
            "source": "node_1",
            "target": "node_7",
            "type": "legal_advisor",
            "status": "confirmed",
            "date": "2000s-2019"
        },
        {
            "source": "node_1",
            "target": "node_8",
            "type": "victim_trafficker",
            "status": "confirmed",
            "date": "2000-2002"
        },
        {
            "source": "node_1",
            "target": "node_9",
            "type": "victim_employer",
            "status": "confirmed",
            "date": "2001-2006"
        },
        {
            "source": "node_1",
            "target": "node_10",
            "type": "criminal_associate",
            "status": "confirmed",
            "date": "1990s-2019"
        },
        {
            "source": "node_1",
            "target": "node_24",
            "type": "employee",
            "status": "confirmed",
            "date": "1976-1981"
        },
        {
            "source": "node_1",
            "target": "node_25",
            "type": "founder",
            "status": "confirmed",
            "date": "1988-2019"
        },
        {
            "source": "node_1",
            "target": "node_26",
            "type": "founder",
            "status": "confirmed",
            "date": "1981-1988"
        },
        {
            "source": "node_1",
            "target": "node_34",
            "type": "owner_resident",
            "status": "confirmed",
            "date": "1990s-2019"
        },
        {
            "source": "node_1",
            "target": "node_35",
            "type": "owner_resident",
            "status": "confirmed",
            "date": "1990s-2019"
        },
        {
            "source": "node_1",
            "target": "node_36",
            "type": "owner",
            "status": "confirmed",
            "date": "1990s-2019"
        },
        {
            "source": "node_3",
            "target": "node_29",
            "type": "ceo_founder",
            "status": "confirmed",
            "date": "1963-present"
        },
        {
            "source": "node_29",
            "target": "node_30",
            "type": "parent_company",
            "status": "confirmed",
            "date": "1982-present"
        },
        {
            "source": "node_3",
            "target": "node_32",
            "type": "founder",
            "status": "suspected",
            "date": "1970s-present"
        },
        {
            "source": "node_1",
            "target": "node_32",
            "type": "director",
            "status": "suspected",
            "date": "1995-2019"
        },
        {
            "source": "node_12",
            "target": "node_24",
            "type": "ceo",
            "status": "confirmed",
            "date": "1970s-1980s"
        },
        {
            "source": "node_13",
            "target": "node_24",
            "type": "ceo",
            "status": "confirmed",
            "date": "1980s-2008"
        },
        {
            "source": "node_14",
            "target": "node_53",
            "type": "president",
            "status": "suspected",
            "date": "1970s-2000"
        },
        {
            "source": "node_14",
            "target": "node_1",
            "type": "client",
            "status": "suspected",
            "date": "1970s-1980s"
        },
        {
            "source": "node_15",
            "target": "node_31",
            "type": "founder",
            "status": "confirmed",
            "date": "1980s-1993"
        },
        {
            "source": "node_1",
            "target": "node_31",
            "type": "consultant",
            "status": "suspected",
            "date": "1987-1989"
        },
        {
            "source": "node_15",
            "target": "node_63",
            "type": "business_associate",
            "status": "suspected",
            "date": "1980s"
        },
        {
            "source": "node_1",
            "target": "node_33",
            "type": "teacher",
            "status": "suspected",
            "date": "1974-1976"
        },
        {
            "source": "node_62",
            "target": "node_33",
            "type": "headmaster",
            "status": "suspected",
            "date": "1960s-1974"
        },
        {
            "source": "node_1",
            "target": "node_28",
            "type": "president",
            "status": "suspected",
            "date": "2000-2007"
        },
        {
            "source": "node_28",
            "target": "node_24",
            "type": "ownership",
            "status": "suspected",
            "date": "2000-2008"
        },
        {
            "source": "node_28",
            "target": "node_48",
            "type": "business_relationship",
            "status": "suspected",
            "date": "2000-2007"
        },
        {
            "source": "node_28",
            "target": "node_49",
            "type": "business_relationship",
            "status": "suspected",
            "date": "2000-2007"
        },
        {
            "source": "node_28",
            "target": "node_50",
            "type": "business_relationship",
            "status": "suspected",
            "date": "2000-2007"
        },
        {
            "source": "node_1",
            "target": "node_51",
            "type": "investor",
            "status": "suspected",
            "date": "2002-2006"
        },
        {
            "source": "node_51",
            "target": "node_52",
            "type": "asset_transfer",
            "status": "suspected",
            "date": "2009"
        },
        {
            "source": "node_1",
            "target": "node_46",
            "type": "acquisition_attempt",
            "status": "suspected",
            "date": "2003"
        },
        {
            "source": "node_1",
            "target": "node_47",
            "type": "co_financier",
            "status": "suspected",
            "date": "2004"
        },
        {
            "source": "node_66",
            "target": "node_47",
            "type": "co_financier",
            "status": "suspected",
            "date": "2004"
        },
        {
            "source": "node_67",
            "target": "node_47",
            "type": "founder",
            "status": "suspected",
            "date": "2004"
        },
        {
            "source": "node_16",
            "target": "node_38",
            "type": "us_attorney",
            "status": "suspected",
            "date": "2005-2009"
        },
        {
            "source": "node_16",
            "target": "node_1",
            "type": "prosecutor",
            "status": "confirmed",
            "date": "2007-2008"
        },
        {
            "source": "node_8",
            "target": "node_43",
            "type": "employee",
            "status": "suspected",
            "date": "2000"
        },
        {
            "source": "node_6",
            "target": "node_43",
            "type": "owner",
            "status": "confirmed",
            "date": "1985-present"
        },
        {
            "source": "node_2",
            "target": "node_8",
            "type": "recruiter",
            "status": "confirmed",
            "date": "2000"
        },
        {
            "source": "node_2",
            "target": "node_9",
            "type": "recruiter",
            "status": "confirmed",
            "date": "2001"
        },
        {
            "source": "node_4",
            "target": "node_9",
            "type": "sexual_assault",
            "status": "confirmed",
            "date": "2001"
        },
        {
            "source": "node_7",
            "target": "node_65",
            "type": "alleged_abuse",
            "status": "confirmed",
            "date": "2000s"
        },
        {
            "source": "node_7",
            "target": "node_42",
            "type": "professor",
            "status": "suspected",
            "date": "1960s-present"
        },
        {
            "source": "node_22",
            "target": "node_1",
            "type": "housekeeper",
            "status": "suspected",
            "date": "1990s-2000s"
        },
        {
            "source": "node_23",
            "target": "node_1",
            "type": "household_employee",
            "status": "suspected",
            "date": "1990s-2000s"
        },
        {
            "source": "node_22",
            "target": "node_7",
            "type": "witness",
            "status": "suspected",
            "date": "2000s"
        },
        {
            "source": "node_19",
            "target": "node_1",
            "type": "social_visitor",
            "status": "suspected",
            "date": "2000s"
        },
        {
            "source": "node_20",
            "target": "node_1",
            "type": "social_associate",
            "status": "suspected",
            "date": "2000s"
        },
        {
            "source": "node_21",
            "target": "node_1",
            "type": "social_guest",
            "status": "suspected",
            "date": "2000s"
        },
        {
            "source": "node_1",
            "target": "node_60",
            "type": "family",
            "status": "suspected",
            "date": "1953-2004"
        },
        {
            "source": "node_1",
            "target": "node_61",
            "type": "family",
            "status": "suspected",
            "date": "1953-1991"
        },
        {
            "source": "node_1",
            "target": "node_41",
            "type": "student",
            "status": "suspected",
            "date": "1967-1969"
        },
        {
            "source": "node_1",
            "target": "node_39",
            "type": "student",
            "status": "suspected",
            "date": "1969-1971"
        },
        {
            "source": "node_1",
            "target": "node_40",
            "type": "student",
            "status": "suspected",
            "date": "1971-1974"
        },
        {
            "source": "node_1",
            "target": "node_59",
            "type": "student",
            "status": "suspected",
            "date": "1967"
        },
        {
            "source": "node_1",
            "target": "node_58",
            "type": "resident",
            "status": "suspected",
            "date": "1953-1970s"
        },
        {
            "source": "node_3",
            "target": "node_57",
            "type": "developer",
            "status": "suspected",
            "date": "1990s-present"
        },
        {
            "source": "node_1",
            "target": "node_57",
            "type": "president",
            "status": "suspected",
            "date": "1990s-2000s"
        },
        {
            "source": "node_1",
            "target": "node_64",
            "type": "client",
            "status": "suspected",
            "date": "1980s-1990s"
        },
        {
            "source": "node_1",
            "target": "node_17",
            "type": "business_associate",
            "status": "suspected",
            "date": "1980s-1990s"
        },
        {
            "source": "node_1",
            "target": "node_18",
            "type": "social_associate",
            "status": "suspected",
            "date": "2000s-2010s"
        },
        {
            "source": "node_31",
            "target": "node_54",
            "type": "takeover_target",
            "status": "suspected",
            "date": "1980s"
        },
        {
            "source": "node_31",
            "target": "node_55",
            "type": "takeover_target",
            "status": "suspected",
            "date": "1980s"
        },
        {
            "source": "node_31",
            "target": "node_56",
            "type": "acquisition",
            "status": "suspected",
            "date": "2014"
        },
        {
            "source": "node_1",
            "target": "node_45",
            "type": "office_location",
            "status": "suspected",
            "date": "1987-1989"
        },
        {
            "source": "node_1",
            "target": "node_37",
            "type": "owner",
            "status": "suspected",
            "date": "1990s-2019"
        },
        {
            "source": "node_6",
            "target": "node_44",
            "type": "owner",
            "status": "suspected",
            "date": "1980s-2000s"
        },
        {
            "source": "node_9",
            "target": "node_44",
            "type": "visitor",
            "status": "suspected",
            "date": "2001"
        },
        {
            "source": "node_1",
            "target": "node_27",
            "type": "founder",
            "status": "confirmed",
            "date": "1996-2019"
        },
        {
            "source": "node_27",
            "target": "node_36",
            "type": "location",
            "status": "suspected",
            "date": "1996-2019"
        },
        {
            "source": "node_10",
            "target": "node_8",
            "type": "trafficker_victim",
            "status": "confirmed",
            "date": "2000s"
        },
        {
            "source": "node_2",
            "target": "node_10",
            "type": "criminal_associate",
            "status": "confirmed",
            "date": "2000s"
        },
        {
            "source": "node_8",
            "target": "node_4",
            "type": "victim_abuser",
            "status": "confirmed",
            "date": "2001"
        },
        {
            "source": "node_8",
            "target": "node_7",
            "type": "accuser_accused",
            "status": "suspected",
            "date": "2010s-2022"
        },
        {
            "source": "node_5",
            "target": "node_1",
            "type": "social_political",
            "status": "confirmed",
            "date": "2000s"
        },
        {
            "source": "node_21",
            "target": "node_36",
            "type": "visitor",
            "status": "suspected",
            "date": "2000s"
        },
        {
            "source": "node_7",
            "target": "node_38",
            "type": "legal_negotiator",
            "status": "confirmed",
            "date": "2007-2008"
        },
        {
            "source": "node_7",
            "target": "node_35",
            "type": "frequent_visitor",
            "status": "suspected",
            "date": "2000s"
        },
        {
            "source": "node_3",
            "target": "node_34",
            "type": "former_owner",
            "status": "confirmed",
            "date": "1990s"
        },
        {
            "source": "node_14",
            "target": "node_24",
            "type": "client",
            "status": "suspected"
        },
        {
            "source": "node_60",
            "target": "node_58",
            "type": "resident",
            "status": "suspected"
        },
        {
            "source": "node_61",
            "target": "node_58",
            "type": "resident",
            "status": "suspected"
        },
        {
            "source": "node_25",
            "target": "node_27",
            "type": "renamed_entity",
            "status": "suspected"
        },
        {
            "source": "node_26",
            "target": "node_25",
            "type": "predecessor_entity",
            "status": "suspected"
        },
        {
            "source": "node_4",
            "target": "node_34",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_9",
            "target": "node_34",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_8",
            "target": "node_34",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_19",
            "target": "node_34",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_7",
            "target": "node_34",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_22",
            "target": "node_35",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_23",
            "target": "node_35",
            "type": "visitor_location",
            "status": "suspected"
        },
        {
            "source": "node_48",
            "target": "node_49",
            "type": "industry_peer",
            "status": "suspected"
        },
        {
            "source": "node_48",
            "target": "node_50",
            "type": "industry_peer",
            "status": "suspected"
        },
        {
            "source": "node_49",
            "target": "node_50",
            "type": "industry_peer",
            "status": "suspected"
        },
        {
            "source": "node_39",
            "target": "node_40",
            "type": "educational_progression",
            "status": "suspected"
        },
        {
            "source": "node_41",
            "target": "node_39",
            "type": "educational_progression",
            "status": "suspected"
        },
        {
            "source": "node_1",
            "target": "node_68",
            "type": "banking_relationship",
            "status": "confirmed",
            "date": "1998-2013"
        },
        {
            "source": "node_1",
            "target": "node_69",
            "type": "banking_relationship",
            "status": "confirmed",
            "date": "2013-2018"
        },
        {
            "source": "node_1",
            "target": "node_70",
            "type": "offshore_banking",
            "status": "confirmed",
            "date": "1997-unknown"
        },
        {
            "source": "node_68",
            "target": "node_8",
            "type": "settlement_agreement",
            "status": "confirmed",
            "date": "2023"
        },
        {
            "source": "node_69",
            "target": "node_8",
            "type": "settlement_agreement",
            "status": "confirmed",
            "date": "2023"
        },
        {
            "source": "node_3",
            "target": "node_68",
            "type": "banking_relationship",
            "status": "suspected",
            "date": "1990s-2000s"
        },
        {
            "source": "node_71",
            "target": "node_8",
            "type": "victims_attorney",
            "status": "confirmed",
            "date": "2019-2023"
        },
        {
            "source": "node_72",
            "target": "node_8",
            "type": "victims_attorney",
            "status": "confirmed",
            "date": "2019-2023"
        },
        {
            "source": "node_73",
            "target": "node_1",
            "type": "federal_prosecutor",
            "status": "confirmed",
            "date": "2019"
        },
        {
            "source": "node_71",
            "target": "node_74",
            "type": "employment",
            "status": "suspected",
            "date": "1997-present"
        },
        {
            "source": "node_72",
            "target": "node_74",
            "type": "employment",
            "status": "suspected",
            "date": "2000s-present"
        },
        {
            "source": "node_73",
            "target": "node_75",
            "type": "employment",
            "status": "confirmed",
            "date": "2018-2020"
        },
        {
            "source": "node_74",
            "target": "node_68",
            "type": "legal_action",
            "status": "confirmed",
            "date": "2022-2023"
        },
        {
            "source": "node_74",
            "target": "node_69",
            "type": "legal_action",
            "status": "confirmed",
            "date": "2022-2023"
        },
        {
            "source": "node_75",
            "target": "node_1",
            "type": "criminal_prosecution",
            "status": "confirmed",
            "date": "2019"
        },
        {
            "source": "node_76",
            "target": "node_1",
            "type": "investigative_journalist",
            "status": "confirmed",
            "date": "2017-2018"
        },
        {
            "source": "node_76",
            "target": "node_8",
            "type": "journalistic_source",
            "status": "confirmed",
            "date": "2017-2018"
        },
        {
            "source": "node_77",
            "target": "node_1",
            "type": "law_enforcement_investigator",
            "status": "confirmed",
            "date": "2005-2009"
        },
        {
            "source": "node_76",
            "target": "node_78",
            "type": "employment",
            "status": "suspected",
            "date": "2000s-present"
        },
        {
            "source": "node_77",
            "target": "node_80",
            "type": "employment",
            "status": "confirmed",
            "date": "2001-2009"
        },
        {
            "source": "node_78",
            "target": "node_1",
            "type": "media_investigation",
            "status": "confirmed",
            "date": "2018"
        },
        {
            "source": "node_79",
            "target": "node_1",
            "type": "federal_investigation",
            "status": "confirmed",
            "date": "2019"
        },
        {
            "source": "node_80",
            "target": "node_1",
            "type": "criminal_investigation",
            "status": "confirmed",
            "date": "2005-2006"
        },
        {
            "source": "node_79",
            "target": "node_75",
            "type": "law_enforcement_coordination",
            "status": "confirmed",
            "date": "2019"
        },
        {
            "source": "node_76",
            "target": "node_16",
            "type": "investigative_scrutiny",
            "status": "confirmed",
            "date": "2018"
        },
        {
            "source": "node_1",
            "target": "node_81",
            "type": "property_ownership",
            "status": "confirmed",
            "date": "1998-2019"
        },
        {
            "source": "node_1",
            "target": "node_82",
            "type": "property_ownership",
            "status": "confirmed",
            "date": "2016-2019"
        },
        {
            "source": "node_1",
            "target": "node_83",
            "type": "property_ownership",
            "status": "confirmed",
            "date": "1990s-2019"
        },
        {
            "source": "node_1",
            "target": "node_84",
            "type": "property_ownership",
            "status": "suspected",
            "date": "Unknown-2019"
        },
        {
            "source": "node_1",
            "target": "node_85",
            "type": "criminal_associate",
            "status": "confirmed",
            "date": "2000s-2019"
        },
        {
            "source": "node_1",
            "target": "node_86",
            "type": "criminal_associate",
            "status": "confirmed",
            "date": "Early 2000s-2013"
        },
        {
            "source": "node_1",
            "target": "node_87",
            "type": "social_business",
            "status": "confirmed",
            "date": "1980s-2019"
        },
        {
            "source": "node_1",
            "target": "node_88",
            "type": "social_personal",
            "status": "confirmed",
            "date": "1980s-2019"
        },
        {
            "source": "node_1",
            "target": "node_89",
            "type": "social_business",
            "status": "confirmed",
            "date": "2013-2017"
        },
        {
            "source": "node_1",
            "target": "node_90",
            "type": "academic_funding",
            "status": "confirmed",
            "date": "2000s-2016"
        },
        {
            "source": "node_1",
            "target": "node_91",
            "type": "academic_social",
            "status": "confirmed",
            "date": "2013-2017"
        },
        {
            "source": "node_87",
            "target": "node_88",
            "type": "family",
            "status": "suspected",
            "date": "1994-present"
        },
        {
            "source": "node_8",
            "target": "node_87",
            "type": "victim_abuser",
            "status": "confirmed",
            "date": "2000s"
        },
        {
            "source": "node_8",
            "target": "node_90",
            "type": "victim_abuser",
            "status": "confirmed",
            "date": "2000s"
        },
        {
            "source": "node_85",
            "target": "node_83",
            "type": "pilot_aircraft",
            "status": "confirmed",
            "date": "2000s-2019"
        },
        {
            "source": "node_89",
            "target": "node_81",
            "type": "visitor",
            "status": "confirmed",
            "date": "2014"
        }
    ]
}


console.log('🔍 Initial data networks loaded:', Object.keys(window.silentPartners.initialData));
