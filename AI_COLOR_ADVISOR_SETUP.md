# AI Color Advisor Feature 🎨✨

## Overview

The AI Color Advisor is a new tab in your CRM that uses AI to analyze house images and provide professional painting color recommendations. Users can upload multiple images of a house from different angles, and the AI will suggest 3 distinct color schemes with detailed application guides.

## Features

✅ **Multi-Image Upload** - Upload multiple house photos from different angles
✅ **AI-Powered Analysis** - Uses OpenRouter API with DeepSeek Chat model
✅ **3 Color Schemes** - Get three professional recommendations per analysis
✅ **Detailed Guidance** - Each recommendation includes:

- Color palette with specific color names
- Application guide (where to apply each color)
- Professional reasoning for the combination
  ✅ **Beautiful UI** - Modern, intuitive interface with image previews
  ✅ **Real-time Processing** - Loading states and progress indicators

## Setup Instructions

### 1. Get Your OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (it starts with `sk-or-v1-...`)

### 2. Configure Environment Variables

1. Create a `.env` file in your project root (if you don't have one)
2. Add your OpenRouter API key:

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

3. Make sure your `.env` file is in `.gitignore` to keep your API key secure

### 3. Install Dependencies (if needed)

The feature uses existing dependencies, but make sure you have:

- `lucide-react` for icons
- `sonner` for toast notifications

If not installed:

```bash
npm install lucide-react sonner
```

### 4. Restart Your Development Server

After adding the environment variable:

```bash
npm run dev
```

## How to Use

### For End Users:

1. **Navigate to AI Color Advisor Tab**

   - Click on the "AI Color Advisor" tab in the navigation (sparkle icon ✨)

2. **Upload House Images**

   - Click the upload area or drag and drop images
   - Upload 2-5 images of the house from different angles
   - Best results with: front view, side views, back view

3. **Analyze**

   - Click "Analyze & Get Recommendations"
   - Wait 10-30 seconds for AI processing

4. **Review Recommendations**

   - Browse through 3 different color scheme options
   - Each option shows:
     - Color palette
     - Where to apply each color
     - Why this combination works

5. **Start Over**
   - Click "Start Over" to analyze a different house

## Technical Details

### API Integration

- **Provider**: OpenRouter.ai
- **Model**: `deepseek/deepseek-chat` (cost-effective and powerful)
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Features Used**: Vision API (image analysis)

### Image Processing

- Images are converted to base64 format
- Sent to AI model along with detailed prompt
- AI analyzes architecture, style, and surroundings
- Returns structured JSON with 3 recommendations

### Cost Considerations

OpenRouter pricing for DeepSeek Chat:

- Very affordable (one of the cheapest vision models)
- Approximately $0.001-0.01 per analysis
- Check current pricing at [OpenRouter Pricing](https://openrouter.ai/docs#models)

## File Structure

```
src/
├── components/
│   ├── AIColorAdvisor.tsx          # Main AI Color Advisor component
│   └── ui/                          # UI components (existing)
├── utils/
│   └── api.ts                       # API configuration (existing)
└── App.tsx                          # Updated with AI tab
```

## Prompt Engineering

The AI is instructed to:

- Act as an expert house painting color consultant
- Analyze architectural style and surroundings
- Provide 3 distinct, professional recommendations
- Include specific color names and application details
- Explain reasoning for each recommendation

## Error Handling

The component handles:

- Missing API key (shows helpful error message)
- API failures (with user-friendly error messages)
- Invalid image formats
- JSON parsing errors (with fallback)
- Network issues

## Future Enhancements

Potential improvements:

- 🎨 Generate actual painted house visualizations (requires image generation API)
- 💾 Save recommendations to database
- 📧 Email recommendations to clients
- 🖼️ Side-by-side comparison view
- 📊 Track popular color combinations
- 🎯 Filter by house style (modern, traditional, etc.)
- 💰 Cost estimation for paint quantities

## Troubleshooting

### "OpenRouter API key not configured" Error

- Make sure `.env` file exists in project root
- Verify the key is named exactly `VITE_OPENROUTER_API_KEY`
- Restart your dev server after adding the key

### Images Not Uploading

- Check file size (should be under 10MB)
- Verify file format (PNG, JPG, WEBP)
- Check browser console for errors

### AI Analysis Fails

- Verify your OpenRouter API key is valid
- Check your OpenRouter account has credits
- Ensure you have internet connection
- Check browser console for detailed error messages

### Recommendations Look Wrong

- Try uploading clearer images
- Include multiple angles of the house
- Ensure good lighting in photos
- Upload higher resolution images

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Protection**

   - Never commit `.env` file to git
   - Keep API keys secret
   - Rotate keys if exposed

2. **Client-Side API Calls**

   - Current implementation makes API calls from browser
   - API key is exposed in browser (acceptable for OpenRouter)
   - For production, consider server-side proxy

3. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Consider adding user quotas
   - Monitor API usage

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Test with a simple house image first
4. Check OpenRouter API status

## Model Information

**DeepSeek Chat**

- Excellent vision capabilities
- Cost-effective pricing
- Fast response times
- Good at understanding architectural details

Alternative models you can try (update in `AIColorAdvisor.tsx`):

- `anthropic/claude-3-haiku` - More expensive but very accurate
- `google/gemini-pro-vision` - Good balance of cost and quality
- `openai/gpt-4-vision-preview` - Premium option

To change the model, update this line in `AIColorAdvisor.tsx`:

```typescript
model: "deepseek/deepseek-chat", // Change this to your preferred model
```

## Credits

- UI Components: shadcn/ui
- Icons: Lucide React
- AI Provider: OpenRouter.ai
- Model: DeepSeek Chat
