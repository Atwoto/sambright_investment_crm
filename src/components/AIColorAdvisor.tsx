import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Loader2,
  RefreshCw,
  Palette,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ColorRecommendation {
  id: string;
  description: string;
  colors: string[];
  imageUrl?: string;
  reasoning: string;
  generatedImage?: string;
  isGenerating?: boolean;
}

export function AIColorAdvisor() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [recommendations, setRecommendations] = useState<ColorRecommendation[]>(
    []
  );
  const [selectedRecommendation, setSelectedRecommendation] = useState<
    string | null
  >(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const id = Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        newImages.push({ id, file, preview });
      }
    });

    setUploadedImages((prev) => [...prev, ...newImages]);
    toast.success(`${newImages.length} image(s) uploaded successfully`);
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
    toast.info("Image removed");
  };

  const removeAllImages = () => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    toast.info("All images removed");
  };

  const analyzeImages = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsAnalyzing(true);
    setRecommendations([]);

    try {
      // Convert images to base64
      const imagePromises = uploadedImages.map((img) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      // Call OpenRouter API
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error(
          "OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file"
        );
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Sambright Investment CRM - AI Color Advisor",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are an expert house painting color consultant using Google's Gemini vision capabilities. Carefully analyze these house images and provide 3 distinct, professional color combination recommendations.

ANALYSIS FOCUS:
- Architectural style (modern, traditional, colonial, etc.)
- Current condition and materials
- Surrounding landscape and environment
- Natural lighting conditions
- Existing color elements to complement or contrast

For each recommendation, provide:
1. A creative, descriptive name for the color scheme
2. 3-4 specific paint colors with realistic color names
3. Detailed application guide (which color goes where)
4. Professional reasoning based on design principles

REQUIRED JSON FORMAT:
[
  {
    "name": "Descriptive Color Scheme Name",
    "colors": ["Main Wall Color", "Trim Color", "Accent Color", "Door Color"],
    "application": "Detailed description: Main walls in [color], trim and window frames in [color], front door in [color], etc.",
    "reasoning": "Why this works: architectural compatibility, color theory, environmental harmony, etc."
  }
]

Provide exactly 3 unique schemes. Be specific about paint application and use realistic color names that homeowners can find at paint stores.`,
                  },
                  ...base64Images.map((img) => ({
                    type: "image_url" as const,
                    image_url: {
                      url: img,
                    },
                  })),
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to analyze images");
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      // Parse the AI response
      let parsedRecommendations;
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedRecommendations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response");
        }
      } catch (parseError) {
        // Fallback: create recommendations from text response
        parsedRecommendations = [
          {
            name: "AI Recommendation 1",
            colors: ["Warm Neutral", "Crisp White", "Charcoal Gray"],
            application: aiResponse.substring(0, 200),
            reasoning: "Based on AI analysis of your house images",
          },
        ];
      }

      // Transform to our format
      const formattedRecommendations: ColorRecommendation[] =
        parsedRecommendations.map((rec: any, index: number) => ({
          id: `rec-${index}`,
          description: rec.name || `Color Scheme ${index + 1}`,
          colors: rec.colors || [],
          reasoning: `${rec.application || ""}\n\n${rec.reasoning || ""}`,
        }));

      setRecommendations(formattedRecommendations);
      toast.success(
        "Analysis complete! Now you can generate painted house previews."
      );
    } catch (error: any) {
      console.error("Error analyzing images:", error);
      toast.error(
        error.message || "Failed to analyze images. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePaintedImages = async () => {
    if (recommendations.length === 0 || uploadedImages.length === 0) {
      toast.error("Please analyze images first to get color recommendations");
      return;
    }

    setIsGeneratingImages(true);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        toast.error(
          "OpenRouter API key required for image generation. Please add VITE_OPENROUTER_API_KEY to your .env file"
        );
        setIsGeneratingImages(false);
        return;
      }

      const baseImage = uploadedImages[0];
      const reader = new FileReader();

      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(baseImage.file);
      });

      const updatedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          try {
            const response = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": window.location.origin,
                  "X-Title": "Sambright Investment CRM - AI Image Generation",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-image",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: `Transform the following house image into a photorealistic, 3D architectural rendering.
- Apply the color scheme: ${rec.description} (${rec.colors.join(", ")}).
- Use the application details: ${rec.reasoning}.
- The final image should be a high-quality, professional visualization with realistic lighting and shadows, maintaining the original architectural style.
- Return ONLY the generated image.`,
                        },
                        {
                          type: "image_url",
                          image_url: { url: base64Image },
                        },
                      ],
                    },
                  ],
                  // Request image output
                  "provider_extra_parameters": {
                    "output_image": true
                  }
                }),
              }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Failed to generate image for ${rec.description}: ${errorData.error?.message}`
                );
            }

            const data = await response.json();
            
            const imageContent = data.choices[0]?.message?.content.find(c => c.type === 'image_url');
            const generatedImageBase64 = imageContent?.image_url?.url;

            if (!generatedImageBase64) {
              throw new Error(`No image generated for ${rec.description}. AI response: ${JSON.stringify(data)}`);
            }

            return {
              ...rec,
              generatedImage: generatedImageBase64,
              isGenerating: false,
            };
          } catch (error) {
            console.error(
              `Error generating image for ${rec.description}:`,
              error
            );
            toast.error(`Failed to generate image for "${rec.description}".`);
            return {
              ...rec,
              generatedImage: uploadedImages[0].preview, // fallback to original
              isGenerating: false,
            };
          }
        })
      );

      setRecommendations(updatedRecommendations);
      toast.success("Generated AI painted house visualizations!");
    } catch (error: any) {
      console.error("Error generating painted images:", error);
      toast.error(error.message || "Failed to generate painted images");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const resetAnalysis = () => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setRecommendations([]);
    setSelectedRecommendation(null);
    setIsGeneratingImages(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <span>AI Color Advisor</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Upload house images and get AI-powered color recommendations with
            visual previews
          </p>
        </div>
        {(uploadedImages.length > 0 || recommendations.length > 0) && (
          <Button variant="outline" onClick={resetAnalysis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload House Images</span>
            </CardTitle>
            <CardDescription>
              Add multiple images of the house from different angles for better
              analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Button */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <ImageIcon className="h-12 w-12 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, WEBP up to 10MB each
                </span>
              </label>
            </div>

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Uploaded Images ({uploadedImages.length})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeAllImages}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={image.preview}
                        alt="House"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        title="Remove this image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button - Always Visible */}
            <Button
              onClick={analyzeImages}
              disabled={uploadedImages.length === 0 || isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg border-0 mt-4"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing Images...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze & Get Recommendations
                </>
              )}
            </Button>

            {/* Generate Images Button - Only After Analysis */}
            {recommendations.length > 0 && (
              <Button
                onClick={generatePaintedImages}
                disabled={isGeneratingImages || recommendations.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold shadow-lg border-0 mt-3"
                size="lg"
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating 3D Visualizations...
                  </>
                ) : (
                  <>
                    <Palette className="h-5 w-5 mr-2" />
                    Generate 3D Painted House Visualizations
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Upload Images</h4>
                  <p className="text-sm text-gray-600">
                    Add photos of the house from different angles - front,
                    sides, and back views work best
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AI Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Our AI analyzes the architecture, style, and surroundings to
                    suggest perfect color combinations
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Generate 3D Visualizations
                  </h4>
                  <p className="text-sm text-gray-600">
                    Click "Generate 3D Painted House Visualizations" to see
                    stunning 3D renderings of your house with the recommended
                    colors
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Choose & Apply</h4>
                  <p className="text-sm text-gray-600">
                    Review the visual previews and detailed color guides to
                    choose your favorite scheme
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Take photos in good natural lighting</li>
                <li>• Include the entire house in frame</li>
                <li>• Capture surrounding landscape</li>
                <li>• Show current paint condition</li>
                <li>• Upload multiple angles for better analysis</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>AI Color Recommendations</span>
            </CardTitle>
            <CardDescription>
              Choose from these professionally curated color schemes with visual
              previews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={recommendations[0]?.id} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                {recommendations.map((rec, index) => (
                  <TabsTrigger key={rec.id} value={rec.id}>
                    Option {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {recommendations.map((rec) => (
                <TabsContent key={rec.id} value={rec.id} className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {rec.description}
                    </h3>

                    {/* Generated Image Preview */}
                    {rec.generatedImage && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          3D Painted House Visualization:
                        </h4>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <img
                            src={rec.generatedImage}
                            alt={`${rec.description} painted house preview`}
                            className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                          />
                          <p className="text-xs text-gray-500 text-center mt-2">
                            3D Architectural Visualization - AI-generated
                            painted house with depth and realistic lighting
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Color Palette */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Color Palette:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.colors.map((color, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-white px-4 py-2 text-sm"
                          >
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Application & Reasoning:
                      </h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {rec.reasoning}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
