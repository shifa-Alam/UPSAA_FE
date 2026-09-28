/**
 * Approximate coordinates for the places alumni write as their "current city". Members
 * type free text (English or Bangla, any spelling), so lookups are normalised and aliases
 * are listed per place. A city not found here is still counted — it's listed under the map.
 */
export interface Place { name: string; nameBn: string; lat: number; lng: number; }

const P = (name: string, nameBn: string, lat: number, lng: number, aliases: string[] = []): [Place, string[]] =>
  [{ name, nameBn, lat, lng }, [name, nameBn, ...aliases]];

const PLACES: [Place, string[]][] = [
  // ---- Bangladesh: all 64 districts (district towns) ----
  P('Dhaka', 'ঢাকা', 23.8103, 90.4125, ['dacca', 'dhaka city']),
  P('Chattogram', 'চট্টগ্রাম', 22.3569, 91.7832, ['chittagong', 'ctg', 'চট্রগ্রাম']),
  P('Sylhet', 'সিলেট', 24.8949, 91.8687),
  P('Rajshahi', 'রাজশাহী', 24.3745, 88.6042),
  P('Khulna', 'খুলনা', 22.8456, 89.5403),
  P('Barishal', 'বরিশাল', 22.701, 90.3535, ['barisal']),
  P('Rangpur', 'রংপুর', 25.7439, 89.2752),
  P('Mymensingh', 'ময়মনসিংহ', 24.7471, 90.4203, ['mymenshingh', 'mymensing', 'ময়মনসিংহ']),
  P('Sherpur', 'শেরপুর', 25.0205, 90.0153),
  P('Jamalpur', 'জামালপুর', 24.9375, 89.9372),
  P('Netrokona', 'নেত্রকোনা', 24.8703, 90.7279, ['netrakona']),
  P('Kishoreganj', 'কিশোরগঞ্জ', 24.4449, 90.7766, ['kishorganj']),
  P('Tangail', 'টাঙ্গাইল', 24.2513, 89.9167),
  P('Gazipur', 'গাজীপুর', 23.9999, 90.4203, ['gajipur', 'tongi', 'টঙ্গী']),
  P('Narayanganj', 'নারায়ণগঞ্জ', 23.6238, 90.5, ['narayangonj', 'নারায়ণগঞ্জ']),
  P('Narsingdi', 'নরসিংদী', 23.9322, 90.7151),
  P('Munshiganj', 'মুন্সিগঞ্জ', 23.5422, 90.5305),
  P('Manikganj', 'মানিকগঞ্জ', 23.8617, 90.0003),
  P('Faridpur', 'ফরিদপুর', 23.6071, 89.8429),
  P('Rajbari', 'রাজবাড়ী', 23.7574, 89.6445),
  P('Gopalganj', 'গোপালগঞ্জ', 23.005, 89.8266),
  P('Madaripur', 'মাদারীপুর', 23.1641, 90.1896),
  P('Shariatpur', 'শরীয়তপুর', 23.2423, 90.4348),
  P('Cumilla', 'কুমিল্লা', 23.4607, 91.1809, ['comilla']),
  P('Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 23.9571, 91.1119),
  P('Chandpur', 'চাঁদপুর', 23.2513, 90.8518),
  P('Noakhali', 'নোয়াখালী', 22.8696, 91.0995, ['maijdee']),
  P('Feni', 'ফেনী', 23.0159, 91.3976),
  P('Lakshmipur', 'লক্ষ্মীপুর', 22.9447, 90.8282, ['laxmipur']),
  P("Cox's Bazar", 'কক্সবাজার', 21.4272, 92.0058, ['coxs bazar', 'cox bazar', 'coxsbazar']),
  P('Khagrachhari', 'খাগড়াছড়ি', 23.1193, 91.9847, ['khagrachari']),
  P('Rangamati', 'রাঙ্গামাটি', 22.7324, 92.2985),
  P('Bandarban', 'বান্দরবান', 22.1953, 92.2184),
  P('Habiganj', 'হবিগঞ্জ', 24.3749, 91.4155),
  P('Moulvibazar', 'মৌলভীবাজার', 24.4829, 91.7774, ['maulvibazar', 'srimangal', 'শ্রীমঙ্গল']),
  P('Sunamganj', 'সুনামগঞ্জ', 25.0658, 91.395),
  P('Bogura', 'বগুড়া', 24.8465, 89.3776, ['bogra']),
  P('Pabna', 'পাবনা', 24.0064, 89.2372),
  P('Sirajganj', 'সিরাজগঞ্জ', 24.4534, 89.7007),
  P('Natore', 'নাটোর', 24.4206, 89.0003),
  P('Naogaon', 'নওগাঁ', 24.7936, 88.9318),
  P('Chapainawabganj', 'চাঁপাইনবাবগঞ্জ', 24.5965, 88.2776, ['chapai nawabganj', 'nawabganj']),
  P('Joypurhat', 'জয়পুরহাট', 25.0968, 89.0227),
  P('Dinajpur', 'দিনাজপুর', 25.6217, 88.6354),
  P('Thakurgaon', 'ঠাকুরগাঁও', 26.0336, 88.4616),
  P('Panchagarh', 'পঞ্চগড়', 26.3411, 88.5542),
  P('Nilphamari', 'নীলফামারী', 25.931, 88.856, ['saidpur', 'সৈয়দপুর']),
  P('Lalmonirhat', 'লালমনিরহাট', 25.9923, 89.2847),
  P('Kurigram', 'কুড়িগ্রাম', 25.8054, 89.6361),
  P('Gaibandha', 'গাইবান্ধা', 25.3288, 89.543),
  P('Jashore', 'যশোর', 23.1664, 89.2081, ['jessore']),
  P('Kushtia', 'কুষ্টিয়া', 23.9013, 89.1204),
  P('Jhenaidah', 'ঝিনাইদহ', 23.5448, 89.1539),
  P('Chuadanga', 'চুয়াডাঙ্গা', 23.6402, 88.8418),
  P('Meherpur', 'মেহেরপুর', 23.7622, 88.6318),
  P('Magura', 'মাগুরা', 23.4873, 89.4198),
  P('Narail', 'নড়াইল', 23.1725, 89.5127),
  P('Satkhira', 'সাতক্ষীরা', 22.7185, 89.0705),
  P('Bagerhat', 'বাগেরহাট', 22.6516, 89.7859),
  P('Patuakhali', 'পটুয়াখালী', 22.3596, 90.3299),
  P('Pirojpur', 'পিরোজপুর', 22.5841, 89.972),
  P('Jhalokati', 'ঝালকাঠি', 22.6406, 90.1987, ['jhalakathi']),
  P('Barguna', 'বরগুনা', 22.1591, 90.1119),
  P('Bhola', 'ভোলা', 22.6859, 90.6482),
  // Home turf: the school's upazila and its neighbours.
  P('Jhenaigati', 'ঝিনাইগাতী', 25.176, 90.066, ['jhinaigati', 'jhenaighati']),
  P('Nalitabari', 'নালিতাবাড়ী', 25.0833, 90.1917),
  P('Sreebardi', 'শ্রীবরদী', 25.1233, 89.9722, ['sribardi', 'sreebordi']),
  P('Nakla', 'নকলা', 24.9967, 90.1811),
  // Dhaka areas people often write instead of "Dhaka".
  P('Uttara', 'উত্তরা', 23.8759, 90.3795),
  P('Mirpur', 'মিরপুর', 23.8223, 90.3654),
  P('Savar', 'সাভার', 23.8583, 90.2667, ['ashulia', 'আশুলিয়া']),
  P('Gulshan', 'গুলশান', 23.7925, 90.4078, ['banani', 'বনানী']),
  P('Dhanmondi', 'ধানমন্ডি', 23.7461, 90.3742),
  P('Mohammadpur', 'মোহাম্মদপুর', 23.7662, 90.3589),

  // ---- Abroad ----
  P('London', 'লন্ডন', 51.5072, -0.1276),
  P('Manchester', 'ম্যানচেস্টার', 53.4808, -2.2426),
  P('Birmingham', 'বার্মিংহাম', 52.4862, -1.8904),
  P('New York', 'নিউ ইয়র্ক', 40.7128, -74.006, ['nyc', 'new york city']),
  P('Washington', 'ওয়াশিংটন', 38.9072, -77.0369, ['washington dc']),
  P('Los Angeles', 'লস অ্যাঞ্জেলেস', 34.0522, -118.2437),
  P('Chicago', 'শিকাগো', 41.8781, -87.6298),
  P('Dallas', 'ডালাস', 32.7767, -96.797),
  P('Houston', 'হিউস্টন', 29.7604, -95.3698),
  P('Boston', 'বোস্টন', 42.3601, -71.0589),
  P('Toronto', 'টরন্টো', 43.6532, -79.3832),
  P('Montreal', 'মন্ট্রিয়ল', 45.5019, -73.5674),
  P('Vancouver', 'ভ্যানকুভার', 49.2827, -123.1207),
  P('Sydney', 'সিডনি', -33.8688, 151.2093),
  P('Melbourne', 'মেলবোর্ন', -37.8136, 144.9631),
  P('Auckland', 'অকল্যান্ড', -36.8485, 174.7633),
  P('Dubai', 'দুবাই', 25.2048, 55.2708),
  P('Abu Dhabi', 'আবুধাবি', 24.4539, 54.3773),
  P('Sharjah', 'শারজাহ', 25.3463, 55.4209),
  P('Riyadh', 'রিয়াদ', 24.7136, 46.6753),
  P('Jeddah', 'জেদ্দা', 21.4858, 39.1925),
  P('Dammam', 'দাম্মাম', 26.4207, 50.0888),
  P('Makkah', 'মক্কা', 21.3891, 39.8579, ['mecca']),
  P('Doha', 'দোহা', 25.2854, 51.531, ['qatar']),
  P('Kuwait City', 'কুয়েত', 29.3759, 47.9774, ['kuwait']),
  P('Muscat', 'মাস্কাট', 23.588, 58.3829, ['oman']),
  P('Manama', 'মানামা', 26.2285, 50.586, ['bahrain']),
  P('Kuala Lumpur', 'কুয়ালালামপুর', 3.139, 101.6869, ['malaysia', 'kl']),
  P('Singapore', 'সিঙ্গাপুর', 1.3521, 103.8198),
  P('Tokyo', 'টোকিও', 35.6762, 139.6503, ['japan']),
  P('Seoul', 'সিউল', 37.5665, 126.978, ['south korea', 'korea']),
  P('Beijing', 'বেইজিং', 39.9042, 116.4074),
  P('Hong Kong', 'হংকং', 22.3193, 114.1694),
  P('Kolkata', 'কলকাতা', 22.5726, 88.3639, ['calcutta']),
  P('Delhi', 'দিল্লি', 28.6139, 77.209, ['new delhi']),
  P('Berlin', 'বার্লিন', 52.52, 13.405, ['germany']),
  P('Paris', 'প্যারিস', 48.8566, 2.3522, ['france']),
  P('Rome', 'রোম', 41.9028, 12.4964, ['italy']),
  P('Stockholm', 'স্টকহোম', 59.3293, 18.0686, ['sweden']),
];

const INDEX = new Map<string, Place>();
for (const [place, names] of PLACES) for (const n of names) INDEX.set(key(n), place);

/** Lower-case, no punctuation, no "district/city/sadar/জেলা/সদর" words. */
function key(s: string): string {
  return s.toLowerCase()
    .replace(/[.,'’`"()\-_/]/g, ' ')
    .replace(/\b(city|district|sadar|upazila|division|town|bangladesh)\b/g, ' ')
    .replace(/(জেলা|সদর|শহর|উপজেলা|বিভাগ|বাংলাদেশ)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The place for a free-text city, trying the whole text, then its first part, then its first word. */
export function findPlace(city: string): Place | null {
  const whole = key(city);
  if (INDEX.has(whole)) return INDEX.get(whole)!;
  const first = key(city.split(/[,،;]/)[0] ?? '');
  if (INDEX.has(first)) return INDEX.get(first)!;
  const word = first.split(' ')[0] ?? '';
  return INDEX.get(word) ?? null;
}

/** Inside Bangladesh's bounding box. */
export function inBangladesh(p: Place): boolean {
  return p.lat > 20.5 && p.lat < 26.7 && p.lng > 88 && p.lng < 92.8;
}
