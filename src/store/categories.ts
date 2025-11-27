// src/store/categories.ts
export type Category = {
  id: string;
  name: string;
  icon: string;   // MaterialIcons name
  color?: string; // optional accent color
};

export const categories: Category[] = [
  { id: "1",  name: "Food", icon: "restaurant-outline", color: "#e0583b" },
  { id: "2", name: "Travel", icon: "airplane-outline", color: "#34a853" },
  { id: "3", name: "Shopping", icon: "cart-outline", color: "#fbbc05" },
  { id: "4", name: "Bills", icon: "document-text-outline", color: "#4285f4" },
  { id: "5", name: "Entertainment", icon: "film-outline", color: "#aa66cc" },
  { id: "6", name: "Health", icon: "heart-outline", color: "#ff4444" },
  { id: "7", name: "Misc", icon: "ellipsis-horizontal-outline", color: "#9e9e9e" }
  // Add more as needed
];
