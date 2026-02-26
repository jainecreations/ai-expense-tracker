export type Category = {
  name: string;
  icon: string;
  color: string;
};

export const categories: Category[] = [
  { name: "Food", icon: "restaurant-outline", color: "#e0583b" },
  { name: "Travel", icon: "airplane-outline", color: "#34a853" },
  { name: "Shopping", icon: "cart-outline", color: "#fbbc05" },
  { name: "Bills", icon: "document-text-outline", color: "#4285f4" },
  { name: "Entertainment", icon: "film-outline", color: "#aa66cc" },
  { name: "Health", icon: "heart-outline", color: "#ff4444" },
];

/**
 * Returns the icon name for a given category.
 */
export const getCategoryIcon = (name: string): string => {
  const category = categories.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );
  return category ? category.icon : "help-circle-outline";
};

/**
 * Returns the color for a given category.
 */
export const getCategoryColor = (name: string): string => {
  const category = categories.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );
  return category ? category.color : "#9e9e9e";
};

// Returns only first name from full name
export const getFirstName = (fullName: string): string => {
  return fullName?.split(" ")[0] || "User";
};

export const formatCurrency = (amount: number | string, currency: string = "INR") => {
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (isNaN(num)) return String(amount);

  // Try Intl.NumberFormat first
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(num);
  } catch (err) {
    // Fallback to simple symbol map
    const symbolMap: Record<string, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      AUD: "A$",
      CAD: "CA$",
    };
    const sym = symbolMap[currency] || currency + " ";
    return `${sym}${num.toFixed(2)}`;
  }
};

export const getCurrencySymbol = (currency: string = "INR") => {
  const symbolMap: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CAD: "CA$",
  };
  return symbolMap[currency] || currency;
};