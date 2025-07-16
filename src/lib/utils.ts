/**
 * 工具函数
 * 提供通用的工具方法
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
