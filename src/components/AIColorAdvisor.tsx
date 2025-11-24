import React, { useState, useEffect } from "react";
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
  Clock,
  CheckCircle2,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { canAccess } from "../lib/permissions";
import { AccessDenied } from "./ui/AccessDenied";
import { cn } from "../lib/utils";

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
  const { user } = useAuth();
  const location = useLocation();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!canAccess(user?.role, location.pathname)) {
    return <AccessDenied />;
  }
  const [recommendations, setRecommendations] = useState<ColorRecommendation[]>(
    []
  );
  const [elapsedTime, setElapsedTime] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const intervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLoading]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const id = Math.random().toString(36).substring(2, 11);
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

      const webhookUrl =
        "https://n8n-n2hx.onrender.com/webhook/ai-color-advisor";

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

      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error(
          "The n8n workflow returned no valid recommendations, or the format was incorrect."
        );
      }

      setRecommendations(result);
      toast.success(
        "Successfully generated AI recommendations and 3D previews!"
      );
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
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            AI Color Advisor
          </h2>
          <p className="text-muted-foreground">
            Upload house images to get AI recommendations and 3D visual previews
          </p>
        </div>
        {(uploadedImages.length > 0 || recommendations.length > 0) && (
          <Button variant="outline" onClick={resetAnalysis} className="glass-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="glass-card p-6 rounded-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload House Images
              </h3>
              <p className="text-sm text-muted-foreground">
                Add multiple images from different angles
              </p>
            </div>
            {uploadedImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeAllImages}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="relative group">
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
              className={cn(
                "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
                uploadedImages.length > 0 ? "h-32" : "h-64"
              )}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  <span className="text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 10MB each
                </p>
              </div>
            </label>
          </div>

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group rounded-lg overflow-hidden border border-border/50 aspect-video"
                >
                  <img
                    src={image.preview}
                    alt="House"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110"
                      title="Remove this image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              How It Works
            </h3>
            <p className="text-sm text-muted-foreground">
              Simple steps to get your perfect color palette
            </p>
          </div>

          <div className="space-y-6 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-purple-500/20 via-blue-500/20 to-transparent"></div>

            <div className="flex items-start space-x-4 relative">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold flex-shrink-0 z-10 ring-4 ring-background">
                1
              </div>
              <div>
                <h4 className="font-medium text-foreground">Upload Images</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Add photos of the house from different angles. Good lighting helps the AI understand the architecture better.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 relative">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0 z-10 ring-4 ring-background">
                2
              </div>
              <div>
                <h4 className="font-medium text-foreground">AI Analysis</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Our advanced AI analyzes the architectural style, surroundings, and lighting to generate tailored color palettes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0 z-10 ring-4 ring-background">
                3
              </div>
              <div>
                <h4 className="font-medium text-foreground">Review & Visualize</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get 3 distinct options with photorealistic 3D previews showing exactly how your house will look.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Pro Tips
            </h4>
            <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1 ml-6 list-disc">
              <li>Take photos in good natural lighting</li>
              <li>Include the entire house in the frame</li>
              <li>Capture the surrounding landscape</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-enter" style={{ animationDelay: '200ms' }}>
        <Button
          onClick={getAiRecommendationsAndPreviews}
          disabled={uploadedImages.length === 0 || isLoading}
          className={cn(
            "w-full h-auto py-8 text-lg font-semibold shadow-lg transition-all duration-300",
            "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Generating Magic...</span>
              </div>
              <span className="text-sm font-normal opacity-90">This may take a few minutes</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <span>Generate AI Recommendations</span>
              </div>
              <span className="text-sm font-normal opacity-90">Get color palettes & 3D previews</span>
            </div>
          )}
        </Button>

        {isLoading && (
          <div className="glass-card p-8 rounded-xl text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-md mx-auto space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-muted opacity-20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl text-primary">
                  {formatTime(elapsedTime)}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Analyzing Architecture</h3>
                <p className="text-muted-foreground">
                  Our AI is studying your images to create the perfect color combinations.
                  Please don't close this page.
                </p>
              </div>

              <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min((elapsedTime / 210) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="glass-card p-6 rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Palette className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Review the generated options for your project
              </p>
            </div>
          </div>

          <Tabs defaultValue={recommendations[0]?.id} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 glass-panel p-1 rounded-xl">
              {recommendations.map((rec, index) => (
                <TabsTrigger
                  key={rec.id}
                  value={rec.id}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Option {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {recommendations.map((rec) => (
              <TabsContent key={rec.id} value={rec.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl border-l-4 border-l-purple-500">
                      <h3 className="text-2xl font-bold mb-2">{rec.description}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {rec.reasoning}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        Color Palette
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {rec.colors.map((color, idx) => (
                          <div key={idx} className="group relative">
                            <Badge
                              variant="outline"
                              className="pl-8 pr-4 py-2 text-sm bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors cursor-default"
                            >
                              <div
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-black/10 shadow-sm"
                                style={{ backgroundColor: color.toLowerCase() }} // Assuming color names are valid CSS colors or hex codes
                              />
                              {color}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button className="flex-1 glass-button">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Select This Option
                      </Button>
                      <Button variant="outline" className="glass-button">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Save to Project
                      </Button>
                    </div>
                  </div>

                  {rec.generatedImage && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI-Generated 3D Preview
                      </h4>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 group">
                        <img
                          src={rec.generatedImage}
                          alt={`${rec.description} painted house preview`}
                          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                          <p className="text-white text-sm font-medium">
                            Photorealistic 3D rendering generated by AI
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
