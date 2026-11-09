import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Fusion de classes utilisée par les composants shadcn. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
