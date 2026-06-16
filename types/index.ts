export interface FoodEntry {
  id: number
  timestamp: string
  food_name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  image_data?: string
}

export interface DailySummary {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  entries: number
}

export interface FoodAnalysis {
  food_name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}
