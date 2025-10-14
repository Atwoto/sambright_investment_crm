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
  reasoning: string;
  generatedImage?: string;
}

export function AIColorAdvisor() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ColorRecommendation[]>([]);

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

  const getAiRecommendationsAndPreviews = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsLoading(true);
    setRecommendations([]);

    try {
      const imagePromises = uploadedImages.map((img) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      // --- MODIFICATION #1: Use the PRODUCTION Webhook URL ---
      const webhookUrl = "https://n8n-n2hx.onrender.com/webhook/ai-color-advisor";

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64Images }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`The n8n workflow returned an error: ${errorText}`);
      }

      const result = await response.json();

      const recommendations = result.recommendations;

      if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error("The n8n workflow returned no valid recommendations.");
      }

      setRecommendations(recommendations);
      toast.success("Successfully generated AI recommendations and 3D previews!");

    } catch (error: any) {
      console.error("Error getting AI recommendations:", error);
      toast.error(error.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setRecommendations([]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <span>AI Color Advisor</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Upload house images to get AI recommendations and 3D visual previews
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload House Images</span>
            </CardTitle>
            <CardDescription>
              Add multiple images of the house from different angles for better results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button
              onClick={getAiRecommendationsAndPreviews}
              disabled={uploadedImages.length === 0 || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg border-0 mt-4"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating AI Recommendations & 3D Previews...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get AI Recommendations & 3D Previews
                </>
              )}
            </Button>
          </CardContent>
        </Card>

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
                    Add photos of the house from different angles for the best results.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Get Previews</h4>
                  <p className="text-sm text-gray-600">
                    Click the button to send your images to our AI workflow, which will generate color palettes and realistic 3D previews.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Review & Choose</h4>
                  <p className="text-sm text-gray-600">
                    Review the 3 different AI-generated options and choose the best fit for your project.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Take photos in good natural lighting.</li>
                <li>• Include the entire house in the frame.</li>
                <li>• Capture the surrounding landscape if possible.</li>
                <li>• Upload multiple angles for a more accurate analysis.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <span>AI Recommendations & 3D Previews</span>
            </CardTitle>
            <CardDescription>
              Review the 3 options generated by our AI workflow.
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

                    {rec.generatedImage && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          AI-Generated 3D Preview:
                        </h4>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <img
                            src={rec.generatedImage}
                            alt={`${rec.description} painted house preview`}
                            className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                          />
                          <p className="text-xs text-gray-500 text-center mt-2">
                            Photorealistic 3D rendering generated by AI.
                          </p>
                        </div>
                      </div>
                    )}

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