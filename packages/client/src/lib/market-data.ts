import type { EconNode, EconEdge, ExchangeDef } from '@econview/shared'
import { GICS_SECTORS } from '@econview/shared'

// ── Market Definitions ─────────────────────────────────────────────────────

export interface MarketDef {
  id: string
  label: string
  type: 'equity' | 'bond' | 'commodity' | 'crypto' | 'derivatives'
  marketCap: number
}

// ── International Exchanges ──────────────────────────────────────────────

export const GLOBAL_EXCHANGES: ExchangeDef[] = [
  // North America
  { id: 'NYSE', name: 'New York Stock Exchange', countryCode: 'USA', region: 'north_america', marketCap: 28.4e12, currency: 'USD', timezone: 'America/New_York' },
  { id: 'NASDAQ', name: 'NASDAQ', countryCode: 'USA', region: 'north_america', marketCap: 25.5e12, currency: 'USD', timezone: 'America/New_York' },
  { id: 'TSX', name: 'Toronto Stock Exchange', countryCode: 'CAN', region: 'north_america', marketCap: 3.2e12, currency: 'CAD', timezone: 'America/Toronto' },
  { id: 'BMV', name: 'Bolsa Mexicana de Valores', countryCode: 'MEX', region: 'north_america', marketCap: 0.55e12, currency: 'MXN', timezone: 'America/Mexico_City' },

  // Western Europe
  { id: 'LSE', name: 'London Stock Exchange', countryCode: 'GBR', region: 'western_europe', marketCap: 3.4e12, currency: 'GBP', timezone: 'Europe/London' },
  { id: 'EURONEXT', name: 'Euronext', countryCode: 'NLD', region: 'western_europe', marketCap: 7.3e12, currency: 'EUR', timezone: 'Europe/Amsterdam' },
  { id: 'XETRA', name: 'Deutsche B\u00f6rse (Xetra)', countryCode: 'DEU', region: 'western_europe', marketCap: 2.3e12, currency: 'EUR', timezone: 'Europe/Berlin' },
  { id: 'SIX', name: 'SIX Swiss Exchange', countryCode: 'CHE', region: 'western_europe', marketCap: 1.9e12, currency: 'CHF', timezone: 'Europe/Zurich' },
  { id: 'BORSA', name: 'Borsa Italiana', countryCode: 'ITA', region: 'western_europe', marketCap: 0.8e12, currency: 'EUR', timezone: 'Europe/Rome' },
  { id: 'BME', name: 'Bolsas y Mercados Espa\u00f1oles', countryCode: 'ESP', region: 'western_europe', marketCap: 0.65e12, currency: 'EUR', timezone: 'Europe/Madrid' },
  { id: 'OMX', name: 'Nasdaq Nordic (OMX)', countryCode: 'SWE', region: 'western_europe', marketCap: 1.8e12, currency: 'SEK', timezone: 'Europe/Stockholm' },

  // East Asia
  { id: 'TSE', name: 'Tokyo Stock Exchange', countryCode: 'JPN', region: 'east_asia', marketCap: 6.5e12, currency: 'JPY', timezone: 'Asia/Tokyo' },
  { id: 'SSE', name: 'Shanghai Stock Exchange', countryCode: 'CHN', region: 'east_asia', marketCap: 7.4e12, currency: 'CNY', timezone: 'Asia/Shanghai' },
  { id: 'SZSE', name: 'Shenzhen Stock Exchange', countryCode: 'CHN', region: 'east_asia', marketCap: 4.8e12, currency: 'CNY', timezone: 'Asia/Shanghai' },
  { id: 'HKEX', name: 'Hong Kong Stock Exchange', countryCode: 'HKG', region: 'east_asia', marketCap: 4.1e12, currency: 'HKD', timezone: 'Asia/Hong_Kong' },
  { id: 'KRX', name: 'Korea Exchange', countryCode: 'KOR', region: 'east_asia', marketCap: 1.8e12, currency: 'KRW', timezone: 'Asia/Seoul' },
  { id: 'TWSE', name: 'Taiwan Stock Exchange', countryCode: 'TWN', region: 'east_asia', marketCap: 2.1e12, currency: 'TWD', timezone: 'Asia/Taipei' },

  // South & Southeast Asia
  { id: 'BSE', name: 'Bombay Stock Exchange', countryCode: 'IND', region: 'south_asia', marketCap: 4.9e12, currency: 'INR', timezone: 'Asia/Kolkata' },
  { id: 'NSE', name: 'National Stock Exchange India', countryCode: 'IND', region: 'south_asia', marketCap: 4.6e12, currency: 'INR', timezone: 'Asia/Kolkata' },
  { id: 'SGX', name: 'Singapore Exchange', countryCode: 'SGP', region: 'southeast_asia', marketCap: 0.65e12, currency: 'SGD', timezone: 'Asia/Singapore' },
  { id: 'SET', name: 'Stock Exchange of Thailand', countryCode: 'THA', region: 'southeast_asia', marketCap: 0.5e12, currency: 'THB', timezone: 'Asia/Bangkok' },
  { id: 'IDX', name: 'Indonesia Stock Exchange', countryCode: 'IDN', region: 'southeast_asia', marketCap: 0.58e12, currency: 'IDR', timezone: 'Asia/Jakarta' },
  { id: 'BURSA', name: 'Bursa Malaysia', countryCode: 'MYS', region: 'southeast_asia', marketCap: 0.38e12, currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
  { id: 'PSE', name: 'Philippine Stock Exchange', countryCode: 'PHL', region: 'southeast_asia', marketCap: 0.25e12, currency: 'PHP', timezone: 'Asia/Manila' },

  // Oceania
  { id: 'ASX', name: 'Australian Securities Exchange', countryCode: 'AUS', region: 'oceania', marketCap: 1.7e12, currency: 'AUD', timezone: 'Australia/Sydney' },
  { id: 'NZX', name: 'New Zealand Exchange', countryCode: 'NZL', region: 'oceania', marketCap: 0.1e12, currency: 'NZD', timezone: 'Pacific/Auckland' },

  // Middle East
  { id: 'TADAWUL', name: 'Saudi Exchange (Tadawul)', countryCode: 'SAU', region: 'middle_east', marketCap: 2.8e12, currency: 'SAR', timezone: 'Asia/Riyadh' },
  { id: 'ADX', name: 'Abu Dhabi Securities Exchange', countryCode: 'ARE', region: 'middle_east', marketCap: 0.75e12, currency: 'AED', timezone: 'Asia/Dubai' },
  { id: 'TASE', name: 'Tel Aviv Stock Exchange', countryCode: 'ISR', region: 'middle_east', marketCap: 0.3e12, currency: 'ILS', timezone: 'Asia/Jerusalem' },
  { id: 'QSE', name: 'Qatar Stock Exchange', countryCode: 'QAT', region: 'middle_east', marketCap: 0.17e12, currency: 'QAR', timezone: 'Asia/Qatar' },

  // Latin America
  { id: 'B3', name: 'B3 (Brasil Bolsa Balc\u00e3o)', countryCode: 'BRA', region: 'latin_america', marketCap: 0.95e12, currency: 'BRL', timezone: 'America/Sao_Paulo' },
  { id: 'BCS', name: 'Bolsa de Santiago', countryCode: 'CHL', region: 'latin_america', marketCap: 0.2e12, currency: 'CLP', timezone: 'America/Santiago' },
  { id: 'BVC', name: 'Bolsa de Valores de Colombia', countryCode: 'COL', region: 'latin_america', marketCap: 0.12e12, currency: 'COP', timezone: 'America/Bogota' },
  { id: 'BVL', name: 'Bolsa de Valores de Lima', countryCode: 'PER', region: 'latin_america', marketCap: 0.09e12, currency: 'PEN', timezone: 'America/Lima' },
  { id: 'BCBA', name: 'Bolsa de Buenos Aires', countryCode: 'ARG', region: 'latin_america', marketCap: 0.06e12, currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },

  // Africa
  { id: 'JSE', name: 'Johannesburg Stock Exchange', countryCode: 'ZAF', region: 'africa', marketCap: 1.1e12, currency: 'ZAR', timezone: 'Africa/Johannesburg' },
  { id: 'NGX', name: 'Nigerian Exchange', countryCode: 'NGA', region: 'africa', marketCap: 0.06e12, currency: 'NGN', timezone: 'Africa/Lagos' },
  { id: 'EGX', name: 'Egyptian Exchange', countryCode: 'EGY', region: 'africa', marketCap: 0.04e12, currency: 'EGP', timezone: 'Africa/Cairo' },

  // Eastern Europe
  { id: 'MOEX', name: 'Moscow Exchange', countryCode: 'RUS', region: 'eastern_europe', marketCap: 0.65e12, currency: 'RUB', timezone: 'Europe/Moscow' },
  { id: 'GPW', name: 'Warsaw Stock Exchange', countryCode: 'POL', region: 'eastern_europe', marketCap: 0.22e12, currency: 'PLN', timezone: 'Europe/Warsaw' },
  { id: 'BIST', name: 'Borsa Istanbul', countryCode: 'TUR', region: 'eastern_europe', marketCap: 0.25e12, currency: 'TRY', timezone: 'Europe/Istanbul' },
  { id: 'PSE_CZ', name: 'Prague Stock Exchange', countryCode: 'CZE', region: 'eastern_europe', marketCap: 0.03e12, currency: 'CZK', timezone: 'Europe/Prague' },
  { id: 'KASE', name: 'Kazakhstan Stock Exchange', countryCode: 'KAZ', region: 'eastern_europe', marketCap: 0.05e12, currency: 'KZT', timezone: 'Asia/Almaty' },

  // Special / Global
  { id: 'BOND_US', name: 'US Bond Market', countryCode: 'USA', region: 'north_america', marketCap: 51.3e12, currency: 'USD', timezone: 'America/New_York' },
  { id: 'CME', name: 'CME Group', countryCode: 'USA', region: 'north_america', marketCap: 5.8e12, currency: 'USD', timezone: 'America/Chicago' },
  { id: 'LME', name: 'London Metal Exchange', countryCode: 'GBR', region: 'western_europe', marketCap: 0, currency: 'USD', timezone: 'Europe/London' },
  { id: 'ICE', name: 'Intercontinental Exchange', countryCode: 'USA', region: 'north_america', marketCap: 0, currency: 'USD', timezone: 'America/New_York' },
  { id: 'CRYPTO', name: 'Crypto Markets', countryCode: 'GLOBAL', region: 'north_america', marketCap: 2.8e12, currency: 'USD', timezone: 'UTC' },
]

// Legacy US Markets accessor (backward compat)
export const US_MARKETS: MarketDef[] = [
  { id: 'NYSE', label: 'New York Stock Exchange', type: 'equity', marketCap: 28.4e12 },
  { id: 'NASDAQ', label: 'NASDAQ', type: 'equity', marketCap: 25.5e12 },
  { id: 'BOND_US', label: 'US Bond Market', type: 'bond', marketCap: 51.3e12 },
  { id: 'CME', label: 'CME Group', type: 'commodity', marketCap: 5.8e12 },
  { id: 'CRYPTO', label: 'Crypto Markets', type: 'crypto', marketCap: 2.8e12 },
]

// ── Helper: get exchanges for a country ───────────────────────────────────────

export function getExchangesForCountry(countryCode: string): ExchangeDef[] {
  return GLOBAL_EXCHANGES.filter(e => e.countryCode === countryCode)
}

// ── GICS Sectors ─────────────────────────────────────────────────────────

export interface SectorDef {
  id: string
  label: string
  color: string
  marketCap: number
}

export const SECTORS: SectorDef[] = [
  { id: 'information_technology', label: 'Information Technology', color: GICS_SECTORS.information_technology.color, marketCap: 16.2e12 },
  { id: 'health_care', label: 'Health Care', color: GICS_SECTORS.health_care.color, marketCap: 7.1e12 },
  { id: 'financials', label: 'Financials', color: GICS_SECTORS.financials.color, marketCap: 8.9e12 },
  { id: 'consumer_discretionary', label: 'Consumer Discretionary', color: GICS_SECTORS.consumer_discretionary.color, marketCap: 6.4e12 },
  { id: 'communication_services', label: 'Communication Services', color: GICS_SECTORS.communication_services.color, marketCap: 5.5e12 },
  { id: 'industrials', label: 'Industrials', color: GICS_SECTORS.industrials.color, marketCap: 5.8e12 },
  { id: 'consumer_staples', label: 'Consumer Staples', color: GICS_SECTORS.consumer_staples.color, marketCap: 3.9e12 },
  { id: 'energy', label: 'Energy', color: GICS_SECTORS.energy.color, marketCap: 2.7e12 },
  { id: 'utilities', label: 'Utilities', color: GICS_SECTORS.utilities.color, marketCap: 1.6e12 },
  { id: 'real_estate', label: 'Real Estate', color: GICS_SECTORS.real_estate.color, marketCap: 1.3e12 },
  { id: 'materials', label: 'Materials', color: GICS_SECTORS.materials.color, marketCap: 1.8e12 },
]

// ── Companies by Sector ──────────────────────────────────────────────────

export interface CompanyDef {
  id: string
  ticker: string
  label: string
  sector: string
  marketCap: number
  color: string
  exchange?: string
  countryCode?: string
}

export const COMPANIES: Record<string, CompanyDef[]> = {
  information_technology: [
    { id: 'AAPL', ticker: 'AAPL', label: 'Apple', sector: 'information_technology', marketCap: 3.44e12, color: GICS_SECTORS.information_technology.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'MSFT', ticker: 'MSFT', label: 'Microsoft', sector: 'information_technology', marketCap: 3.12e12, color: GICS_SECTORS.information_technology.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'NVDA', ticker: 'NVDA', label: 'NVIDIA', sector: 'information_technology', marketCap: 3.39e12, color: GICS_SECTORS.information_technology.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'AVGO', ticker: 'AVGO', label: 'Broadcom', sector: 'information_technology', marketCap: 810e9, color: GICS_SECTORS.information_technology.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'ORCL', ticker: 'ORCL', label: 'Oracle', sector: 'information_technology', marketCap: 420e9, color: GICS_SECTORS.information_technology.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'CRM', ticker: 'CRM', label: 'Salesforce', sector: 'information_technology', marketCap: 285e9, color: GICS_SECTORS.information_technology.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'ADBE', ticker: 'ADBE', label: 'Adobe', sector: 'information_technology', marketCap: 220e9, color: GICS_SECTORS.information_technology.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'AMD', ticker: 'AMD', label: 'AMD', sector: 'information_technology', marketCap: 195e9, color: GICS_SECTORS.information_technology.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'TSM', ticker: 'TSM', label: 'TSMC', sector: 'information_technology', marketCap: 950e9, color: GICS_SECTORS.information_technology.color, exchange: 'TWSE', countryCode: 'TWN' },
    { id: 'ASML', ticker: 'ASML', label: 'ASML Holding', sector: 'information_technology', marketCap: 380e9, color: GICS_SECTORS.information_technology.color, exchange: 'EURONEXT', countryCode: 'NLD' },
    { id: 'SAP', ticker: 'SAP', label: 'SAP SE', sector: 'information_technology', marketCap: 280e9, color: GICS_SECTORS.information_technology.color, exchange: 'XETRA', countryCode: 'DEU' },
    { id: '005930.KS', ticker: '005930.KS', label: 'Samsung Electronics', sector: 'information_technology', marketCap: 340e9, color: GICS_SECTORS.information_technology.color, exchange: 'KRX', countryCode: 'KOR' },
    { id: '6758.T', ticker: '6758.T', label: 'Sony Group', sector: 'information_technology', marketCap: 120e9, color: GICS_SECTORS.information_technology.color, exchange: 'TSE', countryCode: 'JPN' },
    { id: 'INFY', ticker: 'INFY', label: 'Infosys', sector: 'information_technology', marketCap: 85e9, color: GICS_SECTORS.information_technology.color, exchange: 'NSE', countryCode: 'IND' },
  ],
  health_care: [
    { id: 'LLY', ticker: 'LLY', label: 'Eli Lilly', sector: 'health_care', marketCap: 760e9, color: GICS_SECTORS.health_care.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'UNH', ticker: 'UNH', label: 'UnitedHealth', sector: 'health_care', marketCap: 540e9, color: GICS_SECTORS.health_care.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'JNJ', ticker: 'JNJ', label: 'Johnson & Johnson', sector: 'health_care', marketCap: 390e9, color: GICS_SECTORS.health_care.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'ABBV', ticker: 'ABBV', label: 'AbbVie', sector: 'health_care', marketCap: 310e9, color: GICS_SECTORS.health_care.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'MRK', ticker: 'MRK', label: 'Merck', sector: 'health_care', marketCap: 270e9, color: GICS_SECTORS.health_care.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'TMO', ticker: 'TMO', label: 'Thermo Fisher', sector: 'health_care', marketCap: 210e9, color: GICS_SECTORS.health_care.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'NVS', ticker: 'NVS', label: 'Novartis', sector: 'health_care', marketCap: 230e9, color: GICS_SECTORS.health_care.color, exchange: 'SIX', countryCode: 'CHE' },
    { id: 'ROG.SW', ticker: 'ROG.SW', label: 'Roche Holding', sector: 'health_care', marketCap: 210e9, color: GICS_SECTORS.health_care.color, exchange: 'SIX', countryCode: 'CHE' },
    { id: 'AZN', ticker: 'AZN', label: 'AstraZeneca', sector: 'health_care', marketCap: 220e9, color: GICS_SECTORS.health_care.color, exchange: 'LSE', countryCode: 'GBR' },
    { id: 'NVO', ticker: 'NVO', label: 'Novo Nordisk', sector: 'health_care', marketCap: 430e9, color: GICS_SECTORS.health_care.color, exchange: 'OMX', countryCode: 'DNK' },
    { id: 'SAN.PA', ticker: 'SAN.PA', label: 'Sanofi', sector: 'health_care', marketCap: 130e9, color: GICS_SECTORS.health_care.color, exchange: 'EURONEXT', countryCode: 'FRA' },
  ],
  financials: [
    { id: 'BRK.B', ticker: 'BRK.B', label: 'Berkshire Hathaway', sector: 'financials', marketCap: 1.08e12, color: GICS_SECTORS.financials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'JPM', ticker: 'JPM', label: 'JPMorgan Chase', sector: 'financials', marketCap: 680e9, color: GICS_SECTORS.financials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'V', ticker: 'V', label: 'Visa', sector: 'financials', marketCap: 580e9, color: GICS_SECTORS.financials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'MA', ticker: 'MA', label: 'Mastercard', sector: 'financials', marketCap: 460e9, color: GICS_SECTORS.financials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'BAC', ticker: 'BAC', label: 'Bank of America', sector: 'financials', marketCap: 340e9, color: GICS_SECTORS.financials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'GS', ticker: 'GS', label: 'Goldman Sachs', sector: 'financials', marketCap: 170e9, color: GICS_SECTORS.financials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'HSBA.L', ticker: 'HSBA.L', label: 'HSBC Holdings', sector: 'financials', marketCap: 165e9, color: GICS_SECTORS.financials.color, exchange: 'LSE', countryCode: 'GBR' },
    { id: 'BNP.PA', ticker: 'BNP.PA', label: 'BNP Paribas', sector: 'financials', marketCap: 75e9, color: GICS_SECTORS.financials.color, exchange: 'EURONEXT', countryCode: 'FRA' },
    { id: 'UBS', ticker: 'UBS', label: 'UBS Group', sector: 'financials', marketCap: 95e9, color: GICS_SECTORS.financials.color, exchange: 'SIX', countryCode: 'CHE' },
    { id: '8306.T', ticker: '8306.T', label: 'Mitsubishi UFJ', sector: 'financials', marketCap: 120e9, color: GICS_SECTORS.financials.color, exchange: 'TSE', countryCode: 'JPN' },
    { id: '1398.HK', ticker: '1398.HK', label: 'ICBC', sector: 'financials', marketCap: 220e9, color: GICS_SECTORS.financials.color, exchange: 'HKEX', countryCode: 'CHN' },
    { id: 'HDFCBANK.NS', ticker: 'HDFCBANK.NS', label: 'HDFC Bank', sector: 'financials', marketCap: 155e9, color: GICS_SECTORS.financials.color, exchange: 'NSE', countryCode: 'IND' },
    { id: 'RY.TO', ticker: 'RY.TO', label: 'Royal Bank of Canada', sector: 'financials', marketCap: 175e9, color: GICS_SECTORS.financials.color, exchange: 'TSX', countryCode: 'CAN' },
  ],
  consumer_discretionary: [
    { id: 'AMZN', ticker: 'AMZN', label: 'Amazon', sector: 'consumer_discretionary', marketCap: 2.15e12, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'TSLA', ticker: 'TSLA', label: 'Tesla', sector: 'consumer_discretionary', marketCap: 560e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'HD', ticker: 'HD', label: 'Home Depot', sector: 'consumer_discretionary', marketCap: 380e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'MCD', ticker: 'MCD', label: "McDonald's", sector: 'consumer_discretionary', marketCap: 210e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'NKE', ticker: 'NKE', label: 'Nike', sector: 'consumer_discretionary', marketCap: 120e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'SBUX', ticker: 'SBUX', label: 'Starbucks', sector: 'consumer_discretionary', marketCap: 105e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: '7203.T', ticker: '7203.T', label: 'Toyota Motor', sector: 'consumer_discretionary', marketCap: 300e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'TSE', countryCode: 'JPN' },
    { id: 'MC.PA', ticker: 'MC.PA', label: 'LVMH', sector: 'consumer_discretionary', marketCap: 370e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'EURONEXT', countryCode: 'FRA' },
    { id: 'BABA', ticker: 'BABA', label: 'Alibaba Group', sector: 'consumer_discretionary', marketCap: 240e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'HKEX', countryCode: 'CHN' },
    { id: 'PDD', ticker: 'PDD', label: 'PDD Holdings', sector: 'consumer_discretionary', marketCap: 160e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'NASDAQ', countryCode: 'CHN' },
    { id: 'MBG.DE', ticker: 'MBG.DE', label: 'Mercedes-Benz', sector: 'consumer_discretionary', marketCap: 70e9, color: GICS_SECTORS.consumer_discretionary.color, exchange: 'XETRA', countryCode: 'DEU' },
  ],
  communication_services: [
    { id: 'META', ticker: 'META', label: 'Meta Platforms', sector: 'communication_services', marketCap: 1.58e12, color: GICS_SECTORS.communication_services.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'GOOGL', ticker: 'GOOGL', label: 'Alphabet', sector: 'communication_services', marketCap: 2.16e12, color: GICS_SECTORS.communication_services.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'NFLX', ticker: 'NFLX', label: 'Netflix', sector: 'communication_services', marketCap: 390e9, color: GICS_SECTORS.communication_services.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'DIS', ticker: 'DIS', label: 'Walt Disney', sector: 'communication_services', marketCap: 195e9, color: GICS_SECTORS.communication_services.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'CMCSA', ticker: 'CMCSA', label: 'Comcast', sector: 'communication_services', marketCap: 155e9, color: GICS_SECTORS.communication_services.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: '0700.HK', ticker: '0700.HK', label: 'Tencent Holdings', sector: 'communication_services', marketCap: 440e9, color: GICS_SECTORS.communication_services.color, exchange: 'HKEX', countryCode: 'CHN' },
    { id: '9984.T', ticker: '9984.T', label: 'SoftBank Group', sector: 'communication_services', marketCap: 85e9, color: GICS_SECTORS.communication_services.color, exchange: 'TSE', countryCode: 'JPN' },
    { id: 'RELIANCE.NS', ticker: 'RELIANCE.NS', label: 'Reliance Industries', sector: 'communication_services', marketCap: 230e9, color: GICS_SECTORS.communication_services.color, exchange: 'NSE', countryCode: 'IND' },
  ],
  industrials: [
    { id: 'GE', ticker: 'GE', label: 'GE Aerospace', sector: 'industrials', marketCap: 220e9, color: GICS_SECTORS.industrials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'CAT', ticker: 'CAT', label: 'Caterpillar', sector: 'industrials', marketCap: 180e9, color: GICS_SECTORS.industrials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'UNP', ticker: 'UNP', label: 'Union Pacific', sector: 'industrials', marketCap: 155e9, color: GICS_SECTORS.industrials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'RTX', ticker: 'RTX', label: 'RTX Corp', sector: 'industrials', marketCap: 150e9, color: GICS_SECTORS.industrials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'HON', ticker: 'HON', label: 'Honeywell', sector: 'industrials', marketCap: 140e9, color: GICS_SECTORS.industrials.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'BA', ticker: 'BA', label: 'Boeing', sector: 'industrials', marketCap: 115e9, color: GICS_SECTORS.industrials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'SIE.DE', ticker: 'SIE.DE', label: 'Siemens', sector: 'industrials', marketCap: 150e9, color: GICS_SECTORS.industrials.color, exchange: 'XETRA', countryCode: 'DEU' },
    { id: 'AIR.PA', ticker: 'AIR.PA', label: 'Airbus', sector: 'industrials', marketCap: 130e9, color: GICS_SECTORS.industrials.color, exchange: 'EURONEXT', countryCode: 'FRA' },
    { id: 'ABB', ticker: 'ABB', label: 'ABB Ltd', sector: 'industrials', marketCap: 90e9, color: GICS_SECTORS.industrials.color, exchange: 'SIX', countryCode: 'CHE' },
    { id: 'CNR.TO', ticker: 'CNR.TO', label: 'Canadian National Railway', sector: 'industrials', marketCap: 80e9, color: GICS_SECTORS.industrials.color, exchange: 'TSX', countryCode: 'CAN' },
  ],
  consumer_staples: [
    { id: 'WMT', ticker: 'WMT', label: 'Walmart', sector: 'consumer_staples', marketCap: 620e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'PG', ticker: 'PG', label: 'Procter & Gamble', sector: 'consumer_staples', marketCap: 390e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'COST', ticker: 'COST', label: 'Costco', sector: 'consumer_staples', marketCap: 380e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'KO', ticker: 'KO', label: 'Coca-Cola', sector: 'consumer_staples', marketCap: 270e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'PEP', ticker: 'PEP', label: 'PepsiCo', sector: 'consumer_staples', marketCap: 230e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'NESN.SW', ticker: 'NESN.SW', label: 'Nestl\u00e9', sector: 'consumer_staples', marketCap: 270e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'SIX', countryCode: 'CHE' },
    { id: 'ULVR.L', ticker: 'ULVR.L', label: 'Unilever', sector: 'consumer_staples', marketCap: 150e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'LSE', countryCode: 'GBR' },
    { id: 'OR.PA', ticker: 'OR.PA', label: "L'Or\u00e9al", sector: 'consumer_staples', marketCap: 230e9, color: GICS_SECTORS.consumer_staples.color, exchange: 'EURONEXT', countryCode: 'FRA' },
  ],
  energy: [
    { id: 'XOM', ticker: 'XOM', label: 'ExxonMobil', sector: 'energy', marketCap: 480e9, color: GICS_SECTORS.energy.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'CVX', ticker: 'CVX', label: 'Chevron', sector: 'energy', marketCap: 280e9, color: GICS_SECTORS.energy.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'COP', ticker: 'COP', label: 'ConocoPhillips', sector: 'energy', marketCap: 130e9, color: GICS_SECTORS.energy.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'SLB', ticker: 'SLB', label: 'Schlumberger', sector: 'energy', marketCap: 65e9, color: GICS_SECTORS.energy.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'EOG', ticker: 'EOG', label: 'EOG Resources', sector: 'energy', marketCap: 60e9, color: GICS_SECTORS.energy.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'SHEL.L', ticker: 'SHEL.L', label: 'Shell plc', sector: 'energy', marketCap: 220e9, color: GICS_SECTORS.energy.color, exchange: 'LSE', countryCode: 'GBR' },
    { id: 'TTE.PA', ticker: 'TTE.PA', label: 'TotalEnergies', sector: 'energy', marketCap: 155e9, color: GICS_SECTORS.energy.color, exchange: 'EURONEXT', countryCode: 'FRA' },
    { id: '2222.SR', ticker: '2222.SR', label: 'Saudi Aramco', sector: 'energy', marketCap: 1.8e12, color: GICS_SECTORS.energy.color, exchange: 'TADAWUL', countryCode: 'SAU' },
    { id: '0857.HK', ticker: '0857.HK', label: 'PetroChina', sector: 'energy', marketCap: 140e9, color: GICS_SECTORS.energy.color, exchange: 'HKEX', countryCode: 'CHN' },
    { id: 'PETR4.SA', ticker: 'PETR4.SA', label: 'Petrobras', sector: 'energy', marketCap: 90e9, color: GICS_SECTORS.energy.color, exchange: 'B3', countryCode: 'BRA' },
  ],
  utilities: [
    { id: 'NEE', ticker: 'NEE', label: 'NextEra Energy', sector: 'utilities', marketCap: 155e9, color: GICS_SECTORS.utilities.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'SO', ticker: 'SO', label: 'Southern Co', sector: 'utilities', marketCap: 95e9, color: GICS_SECTORS.utilities.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'DUK', ticker: 'DUK', label: 'Duke Energy', sector: 'utilities', marketCap: 82e9, color: GICS_SECTORS.utilities.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'CEG', ticker: 'CEG', label: 'Constellation Energy', sector: 'utilities', marketCap: 72e9, color: GICS_SECTORS.utilities.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'AEP', ticker: 'AEP', label: 'American Electric', sector: 'utilities', marketCap: 50e9, color: GICS_SECTORS.utilities.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'ENEL.MI', ticker: 'ENEL.MI', label: 'Enel SpA', sector: 'utilities', marketCap: 70e9, color: GICS_SECTORS.utilities.color, exchange: 'BORSA', countryCode: 'ITA' },
    { id: 'IBE.MC', ticker: 'IBE.MC', label: 'Iberdrola', sector: 'utilities', marketCap: 85e9, color: GICS_SECTORS.utilities.color, exchange: 'BME', countryCode: 'ESP' },
    { id: 'NG.L', ticker: 'NG.L', label: 'National Grid', sector: 'utilities', marketCap: 55e9, color: GICS_SECTORS.utilities.color, exchange: 'LSE', countryCode: 'GBR' },
  ],
  real_estate: [
    { id: 'PLD', ticker: 'PLD', label: 'Prologis', sector: 'real_estate', marketCap: 110e9, color: GICS_SECTORS.real_estate.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'AMT', ticker: 'AMT', label: 'American Tower', sector: 'real_estate', marketCap: 95e9, color: GICS_SECTORS.real_estate.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'EQIX', ticker: 'EQIX', label: 'Equinix', sector: 'real_estate', marketCap: 80e9, color: GICS_SECTORS.real_estate.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'SPG', ticker: 'SPG', label: 'Simon Property', sector: 'real_estate', marketCap: 55e9, color: GICS_SECTORS.real_estate.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'PSA', ticker: 'PSA', label: 'Public Storage', sector: 'real_estate', marketCap: 52e9, color: GICS_SECTORS.real_estate.color, exchange: 'NYSE', countryCode: 'USA' },
  ],
  materials: [
    { id: 'LIN', ticker: 'LIN', label: 'Linde', sector: 'materials', marketCap: 210e9, color: GICS_SECTORS.materials.color, exchange: 'NASDAQ', countryCode: 'USA' },
    { id: 'APD', ticker: 'APD', label: 'Air Products', sector: 'materials', marketCap: 65e9, color: GICS_SECTORS.materials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'SHW', ticker: 'SHW', label: 'Sherwin-Williams', sector: 'materials', marketCap: 85e9, color: GICS_SECTORS.materials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'FCX', ticker: 'FCX', label: 'Freeport-McMoRan', sector: 'materials', marketCap: 60e9, color: GICS_SECTORS.materials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'ECL', ticker: 'ECL', label: 'Ecolab', sector: 'materials', marketCap: 55e9, color: GICS_SECTORS.materials.color, exchange: 'NYSE', countryCode: 'USA' },
    { id: 'BHP.AX', ticker: 'BHP.AX', label: 'BHP Group', sector: 'materials', marketCap: 160e9, color: GICS_SECTORS.materials.color, exchange: 'ASX', countryCode: 'AUS' },
    { id: 'RIO.L', ticker: 'RIO.L', label: 'Rio Tinto', sector: 'materials', marketCap: 105e9, color: GICS_SECTORS.materials.color, exchange: 'LSE', countryCode: 'GBR' },
    { id: 'VALE3.SA', ticker: 'VALE3.SA', label: 'Vale S.A.', sector: 'materials', marketCap: 55e9, color: GICS_SECTORS.materials.color, exchange: 'B3', countryCode: 'BRA' },
    { id: 'GLEN.L', ticker: 'GLEN.L', label: 'Glencore', sector: 'materials', marketCap: 60e9, color: GICS_SECTORS.materials.color, exchange: 'LSE', countryCode: 'GBR' },
  ],
}

// ── Hierarchy Lookup Helpers ────────────────────────────────────────────

export function getMarketsForCountry(countryId: string): EconNode[] {
  if (countryId === 'USA') {
    return US_MARKETS.map((m) => ({
      id: m.id,
      type: 'market' as const,
      label: m.label,
      exchangeCode: m.id,
      marketCap: m.marketCap,
      parent: countryId,
      children: SECTORS.map((s) => s.id),
    }))
  }
  
  const exchanges = getExchangesForCountry(countryId)
  if (exchanges.length === 0) return []
  
  return exchanges.map((ex) => ({
    id: ex.id,
    type: 'market' as const,
    label: ex.name,
    exchangeCode: ex.id,
    marketCap: ex.marketCap,
    parent: countryId,
    children: SECTORS.map((s) => s.id),
    currency: ex.currency,
  }))
}

export function getSectorsForMarket(_marketId: string): EconNode[] {
  return SECTORS.map((s) => ({
    id: s.id,
    type: 'sector' as const,
    label: s.label,
    sectorCode: s.id,
    marketCap: s.marketCap,
    color: s.color,
    children: (COMPANIES[s.id] ?? []).map((c) => c.id),
  }))
}

export function getCompaniesForSector(sectorId: string): EconNode[] {
  const companies = COMPANIES[sectorId] ?? []
  const sectorDef = SECTORS.find((s) => s.id === sectorId)
  return companies.map((c) => ({
    id: c.id,
    type: 'entity' as const,
    label: c.label,
    ticker: c.ticker,
    marketCap: c.marketCap,
    sectorCode: c.sector,
    color: sectorDef?.color ?? c.color,
    parent: sectorId,
    countryCode: c.countryCode,
  }))
}

export function getNodesForZoom(
  zoomLevel: 'global' | 'market' | 'sector' | 'entity',
  zoomPath: string[],
  countryNodes: EconNode[],
): EconNode[] {
  switch (zoomLevel) {
    case 'global':
      return countryNodes
    case 'market':
      return getMarketsForCountry(zoomPath[0] ?? '')
    case 'sector':
      return getSectorsForMarket(zoomPath[1] ?? '')
    case 'entity':
      return getCompaniesForSector(zoomPath[2] ?? '')
    default:
      return countryNodes
  }
}

export function getEdgesForZoom(
  zoomLevel: 'global' | 'market' | 'sector' | 'entity',
  tradeEdges: EconEdge[],
): EconEdge[] {
  if (zoomLevel === 'global') return tradeEdges
  return []
}

export function getZoomPathLabels(zoomPath: string[], countryNodes: EconNode[]): string[] {
  return zoomPath.map((id, i) => {
    if (i === 0) {
      const country = countryNodes.find((c) => c.id === id)
      return country?.label ?? id
    }
    if (i === 1) {
      const exchange = GLOBAL_EXCHANGES.find((e) => e.id === id)
      if (exchange) return exchange.name
      const market = US_MARKETS.find((m) => m.id === id)
      return market?.label ?? id
    }
    if (i === 2) {
      const sector = SECTORS.find((s) => s.id === id)
      return sector?.label ?? id
    }
    return id
  })
}
