import farmer from "@/assets/pesapap-farmer.png.asset.json";
import merchant from "@/assets/pesapap-merchant.png.asset.json";
import professional from "@/assets/pesapap-professional.png.asset.json";
import retailer from "@/assets/pesapap-retailer.png.asset.json";
import serviceProvider from "@/assets/pesapap-service-provider.png.asset.json";

export const DEMO_STORIES = [
  {
    name: "Demo profile 01",
    role: "Small business owner",
    quote: "A little extra working capital can help a small shop stay ready for its customers.",
    image: merchant.url,
    imageAlt: "Demonstration portrait of a Kenyan shop owner",
  },
  {
    name: "Demo profile 02",
    role: "Farmer",
    quote: "Having options for seasonal costs can make planning the next planting cycle easier.",
    image: farmer.url,
    imageAlt: "Demonstration portrait of a Kenyan farmer",
  },
  {
    name: "Demo profile 03",
    role: "Retail shop owner",
    quote: "Keeping shelves stocked takes planning, especially when customer needs change.",
    image: retailer.url,
    imageAlt: "Demonstration portrait of a Kenyan retail shop owner",
  },
  {
    name: "Demo profile 04",
    role: "Young professional",
    quote: "Clear information makes it easier to weigh a financial decision with confidence.",
    image: professional.url,
    imageAlt: "Demonstration portrait of a Kenyan professional",
  },
  {
    name: "Demo profile 05",
    role: "Service provider",
    quote: "Understanding costs up front helps a small service business plan its next step.",
    image: serviceProvider.url,
    imageAlt: "Demonstration portrait of a Kenyan service provider",
  },
] as const;