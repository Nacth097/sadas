import dotenv from 'dotenv';

dotenv.config();

const defaultAllowedGameBrands = [
  'FREE FIRE',
  'MOBILE LEGENDS',
  'PUBG MOBILE',
  'FARLIGHT 84',
  'FREE FIRE MAX',
  'HAIKYU FLY HIGH',
  'MAGIC CHESS',
  'CAPTAIN TSUBASA ACE',
  'EGGY PARTY',
  'ARENA OF VALOR',
  'SPEED DRIFTERS',
  'HONOR OF KINGS',
  'METAL SLUG AWAKENING',
  'WEREWOLF',
  'MOBILE LEGENDS ADVENTURE',
  'CROSSFIRE',
  'RACING MASTER',
  'POKEMON UNITE',
  'FOOTBALL MASTER 2',
  'THE ANTS UNDERGROUND KINGDOM',
  'MU ORIGIN 2',
  'DELTA FORCE',
  'DESTINY M',
  'MOONLIGHT BLADE M',
  'CALL OF DUTY MOBILE',
  'RAGNAROK M',
  'SWORD OF JUSTICE',
  'PUBG MOBILE LITE',
  'FC MOBILE',
  'ZEPETO',
  'KINGS CHOICE',
  'BLOOD STRIKE',
  'LORDS MOBILE',
  'UNDAWN',
  'ONE PUNCH MAN',
  'POINT BLANK',
  'ASPHALT 9',
  'GARENA',
  'SAUSAGE MAN',
  'SUPER SUS',
  'GENSHIN IMPACT',
  'ARENA BREAKOUT',
  'STUMBLE GUYS',
  'TOWER OF FANTASY',
  'HONKAI STAR RAIL',
  'RAGNAROK ORIGIN',
  'ZENLESS ZONE ZERO',
  'STATE OF SURVIVAL',
  'NARUTO SHIPPUDEN',
  'LEAGUE OF LEGENDS WILD RIFT',
  'WUTHERING WAVES',
  'RAZER GOLD',
  'VALORANT',
  'LEAGUE OF LEGENDS PC',
  'TEAMFIGHT TACTICS MOBILE',
  'RAGNAROK TWILIGHT',
  'MODERN COMBAT 5'
];

const numberFromEnv = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) throw new Error(`Invalid numeric env: ${key}`);
  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: numberFromEnv('PORT', 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  paymentGatewayEnabled: process.env.NODE_ENV === 'test' ? true : process.env.PAYMENT_GATEWAY_ENABLED !== 'false',
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: numberFromEnv('MYSQL_PORT', 3306),
    database: process.env.MYSQL_DATABASE || 'nacth_topup',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
  },
  digiflazz: {
    username: process.env.DIGIFLAZZ_USERNAME || '',
    apiKey: process.env.DIGIFLAZZ_API_KEY || '',
    baseUrl: process.env.DIGIFLAZZ_BASE_URL || 'https://api.digiflazz.com/v1',
    profitMarginPercent: numberFromEnv('DIGIFLAZZ_PROFIT_MARGIN_PERCENT', 10),
    allowedGameBrands: (process.env.DIGIFLAZZ_ALLOWED_GAME_BRANDS || defaultAllowedGameBrands.join(','))
      .split(',')
      .map((brand) => brand.trim().toUpperCase())
      .filter(Boolean)
  },
  tripay: {
    privateKey: process.env.TRIPAY_PRIVATE_KEY || '',
    apiKey: process.env.TRIPAY_API_KEY || '',
    merchantCode: process.env.TRIPAY_MERCHANT_CODE || '',
    baseUrl: process.env.TRIPAY_BASE_URL || 'https://tripay.co.id/api'
  }
};
