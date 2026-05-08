"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type WeatherMood = "cold" | "mild" | "hot" | "rainy";

type CityWeather = {
  city: string;
  temp: number;
  condition: string;
  mood: WeatherMood;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const cities: CityWeather[] = [
  {
    city: "Kathmandu",
    temp: 18,
    condition: "Cloudy",
    mood: "mild",
  },
  {
    city: "Lalitpur",
    temp: 19,
    condition: "Partly cloudy",
    mood: "mild",
  },
  {
    city: "Bhaktapur",
    temp: 17,
    condition: "Cool breeze",
    mood: "cold",
  },
  {
    city: "Pokhara",
    temp: 21,
    condition: "Light breeze",
    mood: "mild",
  },
  {
    city: "Biratnagar",
    temp: 29,
    condition: "Sunny",
    mood: "hot",
  },
  {
    city: "Dharan",
    temp: 26,
    condition: "Warm",
    mood: "hot",
  },
  {
    city: "Butwal",
    temp: 24,
    condition: "Clear",
    mood: "mild",
  },
  {
    city: "Chitwan",
    temp: 28,
    condition: "Humid",
    mood: "hot",
  },
  {
    city: "Hetauda",
    temp: 27,
    condition: "Warm afternoon",
    mood: "hot",
  },
  {
    city: "Janakpur",
    temp: 30,
    condition: "Hot and sunny",
    mood: "hot",
  },
  {
    city: "Birgunj",
    temp: 31,
    condition: "Very warm",
    mood: "hot",
  },
  {
    city: "Nepalgunj",
    temp: 32,
    condition: "Hot day",
    mood: "hot",
  },
  {
    city: "Dhangadhi",
    temp: 31,
    condition: "Sunny and dry",
    mood: "hot",
  },
  {
    city: "Bharatpur",
    temp: 27,
    condition: "Humid breeze",
    mood: "hot",
  },
  {
    city: "Itahari",
    temp: 28,
    condition: "Warm",
    mood: "hot",
  },
  {
    city: "Birtamode",
    temp: 27,
    condition: "Partly sunny",
    mood: "hot",
  },
  {
    city: "Tulsipur",
    temp: 25,
    condition: "Mild warm",
    mood: "mild",
  },
  {
    city: "Ghorahi",
    temp: 24,
    condition: "Comfortable",
    mood: "mild",
  },
  {
    city: "Damak",
    temp: 28,
    condition: "Sunny",
    mood: "hot",
  },
  {
    city: "Ilam",
    temp: 15,
    condition: "Cool and misty",
    mood: "cold",
  },
  {
    city: "Dhulikhel",
    temp: 14,
    condition: "Cold morning",
    mood: "cold",
  },
  {
    city: "Banepa",
    temp: 16,
    condition: "Cool",
    mood: "cold",
  },
];

const outfitMap: Record<
  WeatherMood,
  {
    title: string;
    message: string;
    tags: string[];
    query: string;
    gradient: string;
  }
> = {
  cold: {
    title: "Cold Weather Picks",
    message: "Layer up with warm pieces made for cool Nepali mornings.",
    tags: ["Hoodie", "Jacket", "Sweater", "Sneakers"],
    query: "cold",
    gradient: "from-blue-500/20 via-cyan-400/10 to-white/[0.03]",
  },
  mild: {
    title: "Comfort Weather Picks",
    message: "Perfect weather for relaxed streetwear and everyday outfits.",
    tags: ["Hoodie", "Shirt", "Joggers", "Sneakers"],
    query: "mild",
    gradient: "from-violet-500/20 via-fuchsia-400/10 to-white/[0.03]",
  },
  hot: {
    title: "Warm Weather Picks",
    message: "Stay light, breathable, and comfortable throughout the day.",
    tags: ["T-Shirt", "Shorts", "Light Shoes", "Cap"],
    query: "hot",
    gradient: "from-orange-500/20 via-yellow-400/10 to-white/[0.03]",
  },
  rainy: {
    title: "Rain Ready Picks",
    message: "Smart layers and footwear choices for wet weather days.",
    tags: ["Jacket", "Hoodie", "Dark Pants", "Waterproof Shoes"],
    query: "rainy",
    gradient: "from-sky-500/20 via-indigo-400/10 to-white/[0.03]",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

function getWeatherIcon(mood: WeatherMood) {
  if (mood === "cold") return "❄️";
  if (mood === "hot") return "☀️";
  if (mood === "rainy") return "🌧️";
  return "☁️";
}

export default function WeatherOutfitSuggestion() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = React.useState("Kathmandu");

  const weather = React.useMemo(() => {
    return cities.find((c) => c.city === selectedCity) || cities[0];
  }, [selectedCity]);

  const outfit = outfitMap[weather.mood];

  const goToWeatherPicks = () => {
    const params = new URLSearchParams();

    params.set("weather", outfit.query);
    params.set("city", weather.city);

    router.push(`/collection?${params.toString()}`);
  };

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.55 }}
          className={`${panelClass} overflow-hidden`}
        >
          <div
            className={`relative overflow-hidden bg-gradient-to-br ${outfit.gradient}`}
          >
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

            <div className="relative grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-8">
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                    <span>Smart Weather Styling</span>
                  </div>

                  <h2 className="mt-4 max-w-[520px] text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[34px] lg:text-[42px]">
                    Outfit suggestions based on today&apos;s weather
                  </h2>

                  <p className="mt-3 max-w-[540px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
                    Choose your city and UFO Collection will recommend outfit
                    categories that match the weather.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="h-12 rounded-full border border-white/15 bg-[#0d0f17] px-4 text-[13px] font-medium text-white outline-none transition focus:border-white/35"
                    aria-label="Select city"
                  >
                    {cities.map((city) => (
                      <option key={city.city} value={city.city}>
                        {city.city}
                      </option>
                    ))}
                  </select>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    onClick={goToWeatherPicks}
                    className="h-12 rounded-full bg-white px-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90"
                  >
                    Shop Weather Picks
                  </motion.button>
                </div>
              </div>

              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="rounded-[22px] border border-white/10 bg-[#0d0f17]/80 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[13px] uppercase tracking-[0.18em] text-[#a7aec4]">
                      Today in {weather.city}
                    </div>

                    <div className="mt-2 flex items-end gap-3">
                      <div className="text-[48px] leading-none sm:text-[58px]">
                        {getWeatherIcon(weather.mood)}
                      </div>

                      <div>
                        <div className="text-[34px] font-semibold leading-none text-white sm:text-[42px]">
                          {weather.temp}°C
                        </div>
                        <div className="mt-1 text-[13px] text-[#a7aec4]">
                          {weather.condition}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    {outfit.title}
                  </div>
                </div>

                <div className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[16px] font-semibold text-white">
                    Recommended for today
                  </div>

                  <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
                    {outfit.message}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {outfit.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          router.push(
                            `/collection?search=${encodeURIComponent(tag)}`
                          )
                        }
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/10"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-[#a7aec4] sm:grid-cols-4">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-white">Smart</div>
                    <div className="mt-1">Personalized picks</div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-white">Local</div>
                    <div className="mt-1">22 Nepal cities</div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-white">Useful</div>
                    <div className="mt-1">Daily outfit idea</div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-white">Unique</div>
                    <div className="mt-1">FYP feature</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}