import {
  Bitcount_Prop_Single,
  Diphylleia,
  Do_Hyeon,
  Gowun_Batang,
  Nanum_Gothic,
  Song_Myung,
} from "next/font/google";

export const nanum_gothic = Nanum_Gothic({
  weight: ["400", "700", "800"],
  variable: "--font-nanum-gothic",
  display: "swap",
  preload: false,
});

export const bitcount = Bitcount_Prop_Single({
  weight: ["400"],
  variable: "--font-bitcount",
  display: "swap",
  subsets: ["latin"],
  adjustFontFallback: false,
});

export const gowun_batang = Gowun_Batang({
  weight: ["400", "700"],
  variable: "--font-gowun-batang",
  display: "swap",
  preload: false,
});

export const song_myung = Song_Myung({
  weight: ["400"],
  variable: "--font-song-myung",
  display: "swap",
});

export const do_hyeon = Do_Hyeon({
  weight: ["400"],
  variable: "--font-do-hyeon",
  display: "swap",
  preload: false,
});

export const diphylleia = Diphylleia({
  weight: ["400"],
  variable: "--font-diphylleia",
  display: "swap",
  preload: false,
});
