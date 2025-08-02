import { twMerge } from "tailwind-merge";
import type { ClassNameValue } from "tailwind-merge";

export const cn: (...classLists: ClassNameValue[]) => string = twMerge;