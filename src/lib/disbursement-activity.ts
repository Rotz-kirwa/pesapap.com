const DEMO_NAMES = [
  "Akinyi",
  "Amara",
  "Amina",
  "Baraka",
  "Brian",
  "Chebet",
  "David",
  "Eunice",
  "Faith",
  "George",
  "Hassan",
  "Irene",
  "Jabari",
  "Kamau",
  "Linet",
  "Miriam",
  "Nia",
  "Otieno",
  "Peter",
  "Ruth",
  "Wanjiku",
  "Wekesa",
  "Yusuf",
  "Zawadi",
] as const;

const DEMO_CATEGORIES = [
  "Personal",
  "Business",
  "Education",
  "Agriculture",
  "Emergency",
  "Medical",
] as const;

/**
 * Deterministic fictional examples for the homepage ticker; these are not
 * customer records or actual disbursements.
 */
export const DEMO_DISBURSEMENT_ACTIVITY = Array.from({ length: 240 }, (_, index) => {
  const phoneGroup = 10 + Math.floor(index / 100);
  const phoneIndex = index % 100;
  const maskedPhone = `07${phoneGroup}****${String(phoneIndex).padStart(2, "0")}`;

  return {
    id: `DEMO-ACTIVITY-${String(index + 1).padStart(3, "0")}`,
    name: DEMO_NAMES[index % DEMO_NAMES.length]!,
    maskedPhone,
    loanCategory: DEMO_CATEGORIES[index % DEMO_CATEGORIES.length]!,
    amountKes: 5_000 + ((index * 7919) % 496) * 1_000,
  };
});
