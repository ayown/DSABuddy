import { twMerge } from "tailwind-merge";

export const cn = (...classLists) => twMerge(...classLists);