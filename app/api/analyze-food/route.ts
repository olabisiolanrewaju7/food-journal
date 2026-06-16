import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a nutrition analysis expert. When given a food image, return ONLY a valid JSON object with no markdown fences, no explanation — just the raw JSON.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze the food in this image and return a JSON object with exactly these fields:
{
  "food_name": "concise name of the food (list all items if multiple)",
  "description": "brief description including estimated portion size",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>
}
If multiple foods are visible, sum all values and list all items in food_name. Be specific about estimated portion sizes.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Strip markdown fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(clean)

    return NextResponse.json(analysis)
  } catch (err) {
    console.error('analyze-food error:', err)
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
  }
}
