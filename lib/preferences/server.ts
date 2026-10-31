import { cookies } from "next/headers"

import {
  DISPLAY_COOKIE,
  parseDisplayPreferences,
  type DisplayPreferences,
} from "@/lib/preferences/display"

/** Preferensi tampilan untuk permintaan ini; bawaannya mengikuti perangkat. */
export async function getDisplayPreferences(): Promise<DisplayPreferences> {
  return parseDisplayPreferences((await cookies()).get(DISPLAY_COOKIE)?.value)
}
