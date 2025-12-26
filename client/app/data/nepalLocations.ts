// app/data/nepalLocations.ts

export type Province = {
  id: string;
  name: string;
};

export type District = {
  provinceId: string;
  name: string;
};

export type LocalLevel = {
  provinceId: string;
  district: string;
  name: string;
};

export const NEPAL_PROVINCES: Province[] = [
  { id: "p1", name: "Koshi Province" },
  { id: "p2", name: "Madhesh Province" },
  { id: "p3", name: "Bagmati Province" },
  { id: "p4", name: "Gandaki Province" },
  { id: "p5", name: "Lumbini Province" },
  { id: "p6", name: "Karnali Province" },
  { id: "p7", name: "Sudurpashchim Province" },
];

// ✅ 77 Districts (province-wise)
export const NEPAL_DISTRICTS: District[] = [
  // Koshi (14)
  { provinceId: "p1", name: "Bhojpur" },
  { provinceId: "p1", name: "Dhankuta" },
  { provinceId: "p1", name: "Ilam" },
  { provinceId: "p1", name: "Jhapa" },
  { provinceId: "p1", name: "Khotang" },
  { provinceId: "p1", name: "Morang" },
  { provinceId: "p1", name: "Okhaldhunga" },
  { provinceId: "p1", name: "Panchthar" },
  { provinceId: "p1", name: "Sankhuwasabha" },
  { provinceId: "p1", name: "Solukhumbu" },
  { provinceId: "p1", name: "Sunsari" },
  { provinceId: "p1", name: "Taplejung" },
  { provinceId: "p1", name: "Terhathum" },
  { provinceId: "p1", name: "Udayapur" },

  // Madhesh (8)
  { provinceId: "p2", name: "Bara" },
  { provinceId: "p2", name: "Dhanusha" },
  { provinceId: "p2", name: "Mahottari" },
  { provinceId: "p2", name: "Parsa" },
  { provinceId: "p2", name: "Rautahat" },
  { provinceId: "p2", name: "Saptari" },
  { provinceId: "p2", name: "Sarlahi" },
  { provinceId: "p2", name: "Siraha" },

  // Bagmati (13)
  { provinceId: "p3", name: "Bhaktapur" },
  { provinceId: "p3", name: "Chitwan" },
  { provinceId: "p3", name: "Dhading" },
  { provinceId: "p3", name: "Dolakha" },
  { provinceId: "p3", name: "Kathmandu" },
  { provinceId: "p3", name: "Kavrepalanchok" },
  { provinceId: "p3", name: "Lalitpur" },
  { provinceId: "p3", name: "Makwanpur" },
  { provinceId: "p3", name: "Nuwakot" },
  { provinceId: "p3", name: "Ramechhap" },
  { provinceId: "p3", name: "Rasuwa" },
  { provinceId: "p3", name: "Sindhuli" },
  { provinceId: "p3", name: "Sindhupalchok" },

  // Gandaki (11)
  { provinceId: "p4", name: "Baglung" },
  { provinceId: "p4", name: "Gorkha" },
  { provinceId: "p4", name: "Kaski" },
  { provinceId: "p4", name: "Lamjung" },
  { provinceId: "p4", name: "Manang" },
  { provinceId: "p4", name: "Mustang" },
  { provinceId: "p4", name: "Myagdi" },
  { provinceId: "p4", name: "Nawalpur" },
  { provinceId: "p4", name: "Parbat" },
  { provinceId: "p4", name: "Syangja" },
  { provinceId: "p4", name: "Tanahun" },

  // Lumbini (12)
  { provinceId: "p5", name: "Arghakhanchi" },
  { provinceId: "p5", name: "Banke" },
  { provinceId: "p5", name: "Bardiya" },
  { provinceId: "p5", name: "Dang" },
  { provinceId: "p5", name: "Gulmi" },
  { provinceId: "p5", name: "Kapilvastu" },
  { provinceId: "p5", name: "Parasi (Nawalparasi West)" },
  { provinceId: "p5", name: "Palpa" },
  { provinceId: "p5", name: "Pyuthan" },
  { provinceId: "p5", name: "Rolpa" },
  { provinceId: "p5", name: "Rukum East" },
  { provinceId: "p5", name: "Rupandehi" },

  // Karnali (10)
  { provinceId: "p6", name: "Dailekh" },
  { provinceId: "p6", name: "Dolpa" },
  { provinceId: "p6", name: "Humla" },
  { provinceId: "p6", name: "Jajarkot" },
  { provinceId: "p6", name: "Jumla" },
  { provinceId: "p6", name: "Kalikot" },
  { provinceId: "p6", name: "Mugu" },
  { provinceId: "p6", name: "Rukum West" },
  { provinceId: "p6", name: "Salyan" },
  { provinceId: "p6", name: "Surkhet" },

  // Sudurpashchim (9)
  { provinceId: "p7", name: "Achham" },
  { provinceId: "p7", name: "Baitadi" },
  { provinceId: "p7", name: "Bajhang" },
  { provinceId: "p7", name: "Bajura" },
  { provinceId: "p7", name: "Dadeldhura" },
  { provinceId: "p7", name: "Darchula" },
  { provinceId: "p7", name: "Doti" },
  { provinceId: "p7", name: "Kailali" },
  { provinceId: "p7", name: "Kanchanpur" },
];

// ✅ Major City / Municipality starter list (you can expand anytime)
export const NEPAL_LOCAL_LEVELS_MAJOR: LocalLevel[] = [
  // Bagmati
  { provinceId: "p3", district: "Kathmandu", name: "Kathmandu Metropolitan City" },
  { provinceId: "p3", district: "Kathmandu", name: "Kirtipur Municipality" },
  { provinceId: "p3", district: "Kathmandu", name: "Tokha Municipality" },
  { provinceId: "p3", district: "Kathmandu", name: "Budhanilkantha Municipality" },
  { provinceId: "p3", district: "Lalitpur", name: "Lalitpur Metropolitan City" },
  { provinceId: "p3", district: "Bhaktapur", name: "Bhaktapur Municipality" },
  { provinceId: "p3", district: "Chitwan", name: "Bharatpur Metropolitan City" },
  { provinceId: "p3", district: "Makwanpur", name: "Hetauda Sub-Metropolitan City" },

  // Koshi
  { provinceId: "p1", district: "Morang", name: "Biratnagar Metropolitan City" },
  { provinceId: "p1", district: "Sunsari", name: "Itahari Sub-Metropolitan City" },
  { provinceId: "p1", district: "Jhapa", name: "Birtamod Municipality" },
  { provinceId: "p1", district: "Jhapa", name: "Damak Municipality" },

  // Madhesh
  { provinceId: "p2", district: "Dhanusha", name: "Janakpur Sub-Metropolitan City" },
  { provinceId: "p2", district: "Parsa", name: "Birgunj Metropolitan City" },

  // Gandaki
  { provinceId: "p4", district: "Kaski", name: "Pokhara Metropolitan City" },

  // Lumbini
  { provinceId: "p5", district: "Rupandehi", name: "Butwal Sub-Metropolitan City" },
  { provinceId: "p5", district: "Rupandehi", name: "Siddharthanagar Municipality" },
  { provinceId: "p5", district: "Banke", name: "Nepalgunj Sub-Metropolitan City" },

  // Karnali
  { provinceId: "p6", district: "Surkhet", name: "Birendranagar Municipality" },

  // Sudurpashchim
  { provinceId: "p7", district: "Kailali", name: "Dhangadhi Sub-Metropolitan City" },
  { provinceId: "p7", district: "Kanchanpur", name: "Bhimdatta Municipality" },
];
