export const buttonBase =
  "inline-flex items-center justify-center font-semibold rounded-lg transition-standard focus-ring-flat disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

export const buttonSizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
};

export const buttonVariants = {
  primary:
    "bg-forest-600 hover:bg-forest-700 text-white border-2 border-transparent",
  secondary:
    "bg-terracotta-500 hover:bg-terracotta-600 text-white border-2 border-transparent",
  accent: "bg-sage-500 hover:bg-sage-600 text-white border-2 border-transparent",
  outline:
    "bg-transparent border-2 border-cream-200 text-forest-700 hover:border-forest-300 hover:bg-cream-50",
  ghost: "bg-transparent hover:bg-forest-50 text-forest-700",
  destructive:
    "bg-terracotta-600 hover:bg-terracotta-700 text-white border-2 border-transparent",
};

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
