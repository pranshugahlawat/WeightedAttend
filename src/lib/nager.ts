export type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
};

export async function fetchPublicHolidays(year: number, countryCode: string) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch holidays");
  return (await res.json()) as NagerHoliday[];
}