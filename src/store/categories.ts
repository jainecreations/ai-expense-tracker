// src/store/categories.ts
export type Category = {
  id: string;
  name: string;
  icon: string;   // MaterialIcons name
  color?: string; // optional accent color
};

export const categories: Category[] = [
  { id: "1", name: "Groceries", icon: "shopping-cart", color: "#4ade80" },
  { id: "2", name: "Utilities", icon: "flash-on", color: "#facc15" },
  { id: "3", name: "Dining Out", icon: "restaurant", color: "#f87171" },
  // Add more as needed
];
