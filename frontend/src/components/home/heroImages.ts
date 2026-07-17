// Real photos are stored in `frontend/public/picture/` and served by Next at `/picture/...`.
export const HERO_IMAGE_URLS = {
  // Hero (requested)
  // NOTE: this must match EXACTLY the filename under `frontend/public/picture/`.
  // Actual file is: `MacBook Air Gold Mockup - PSD - 80958 _ Yellow Images.jpeg`
  macbook: "/picture/MacBook%20Air%20Gold%20Mockup%20-%20PSD%20-%2080958%20_%20Yellow%20Images.jpeg",


  iphone: "/picture/iPhone.jpeg",
  watch:
    "/picture/Apple%20Watch%20SE%20(2nd%20Gen)%20%5BGPS%2044mm%5D%20Smart%20Watch%20w_Silver%20Aluminum%20Case%20%26%20White%20Sport%20Band%20-%20M_L_.jpeg",
  airpods: "/picture/AirPods.jpeg",


  // Note: these filenames contain a literal newline before `.jpeg`.
  // URL-encode it as `%0A`.
  mouse: "/picture/Gaming%20Mouse%0A.jpeg",
  keyboard: "/picture/Mechanical%20Keyboard%0A.jpeg",
  headset: "/picture/Gaming%20Headset%0A.jpeg",

  monitor: "/picture/Monitor.jpeg",
} as const;

