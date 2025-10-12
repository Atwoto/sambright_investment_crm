import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  clientId: string;
  clientName: string;
  description?: string;
  projectType: string;
  status: "planning" | "in_progress" | "completed" | "on_hold" | "cancelled";
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  actualCost?: number;
  location?: string;
  notes?: string;
  images?: string[];
  videoLink?: string;
  createdAt: string;
}

export function ProjectsManager() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (clientsData) setClients(clientsData);

      // Load projects
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedProjects = (projectsData || []).map((p) => ({
        id: p.id,
        projectNumber: p.project_number,
        name: p.name,
        clientId: p.client_id,
        clientName:
          clientsData?.find((c) => c.id === p.client_id)?.name ||
          "Unknown Client",
        description: p.description,
        projectType: p.project_type || "painting",
        status: p.status || "planning",
        startDate: p.start_date,
        endDate: p.end_date,
        estimatedBudget: p.estimated_budget,
        actualCost: p.actual_cost || 0,
        location: p.location,
        notes: p.notes,
        images: p.images || [],
        videoLink: p.video_link || "",
        createdAt: p.created_at,
      }));

      setProjects(mappedProjects);
      console.log(`Loaded ${mappedProjects.length} projects`);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
      setProjects([]);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from("project-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("project-images").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.clientId) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Creating project...");

    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        toast.loading("Uploading images...", { id: toastId });
        imageUrls = await uploadImages(selectedFiles);
        setUploadingImages(false);
      }
      const projectData = {
        project_number: `PRJ-${new Date().getFullYear()}-${String(
          Math.floor(Math.random() * 1000)
        ).padStart(3, "0")}`,
        name: newProject.name,
        client_id: newProject.clientId,
        description: newProject.description || "",
        project_type: newProject.projectType || "painting",
        status: newProject.status || "planning",
        start_date: newProject.startDate || null,
        end_date: newProject.endDate || null,
        estimated_budget: newProject.estimatedBudget || 0,
        actual_cost: newProject.actualCost || 0,
        location: newProject.location || "",
        notes: newProject.notes || "",
        images: imageUrls,
        video_link: newProject.videoLink || "",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("projects")
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Project created successfully", { id: toastId });
      setIsAddDialogOpen(false);
      setNewProject({});
      setSelectedFiles([]);
      loadData();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    const toastId = toast.loading("Deleting project...");

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      toast.success("Project deleted successfully", { id: toastId });
      loadData();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project", { id: toastId });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planning: "secondary",
      in_progress: "default",
      completed: "default",
      on_hold: "outline",
      cancelled: "destructive",
    } as const;
    const colors = {
      planning: "text-gray-600",
      in_progress: "text-blue-600",
      completed: "text-green-600",
      on_hold: "text-orange-600",
      cancelled: "text-red-600",
    };
    return (
      <Badge
        variant={variants[status as keyof typeof variants] || "outline"}
        className={colors[status as keyof typeof colors]}
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "on_hold":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Briefcase className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600">
            Manage client projects and track progress
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project for a client
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client *
                </Label>
                <Select
                  value={newProject.clientId}
                  onValueChange={(value) =>
                    setNewProject({ ...newProject, clientId: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Project Name *
                </Label>
                <Input
                  id="name"
                  value={newProject.name || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="e.g., Office Interior Painting"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="projectType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newProject.projectType || "painting"}
                  onValueChange={(value) =>
                    setNewProject({ ...newProject, projectType: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="painting">Painting</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={newProject.status || "planning"}
                  onValueChange={(value) =>
                    setNewProject({ ...newProject, status: value as any })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={newProject.location || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, location: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Project location"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newProject.startDate || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, startDate: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newProject.endDate || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, endDate: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimatedBudget" className="text-right">
                  Est. Budget
                </Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  step="0.01"
                  value={newProject.estimatedBudget || ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      estimatedBudget: parseFloat(e.target.value),
                    })
                  }
                  className="col-span-3"
                  placeholder="Estimated budget"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newProject.description || ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3 h-20"
                  placeholder="Project description..."
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="images" className="text-right pt-2">
                  Images (Optional)
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(files);
                    }}
                    className="cursor-pointer"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {selectedFiles.length} image(s) selected (
                      {(
                        selectedFiles.reduce((sum, f) => sum + f.size, 0) /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB)
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload project photos (max 10MB per image)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="videoLink" className="text-right">
                  Video Link (Optional)
                </Label>
                <Input
                  id="videoLink"
                  value={newProject.videoLink || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, videoLink: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={newProject.notes || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, notes: e.target.value })
                  }
                  className="col-span-3 h-16"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 sticky bottom-0 bg-white pt-4 border-t mt-2">
              <Button
                onClick={handleAddProject}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 bg-white/50 backdrop-blur-sm border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects by name, client, number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg truncate">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {project.projectNumber}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(project.status)}
                  {getStatusBadge(project.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{project.clientName}</span>
              </div>

              {project.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{project.location}</span>
                </div>
              )}

              {project.startDate && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {new Date(project.startDate).toLocaleDateString()}
                    {project.endDate &&
                      ` - ${new Date(project.endDate).toLocaleDateString()}`}
                  </span>
                </div>
              )}

              {project.estimatedBudget && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 font-semibold">
                    {formatCurrency(project.estimatedBudget)}
                  </span>
                </div>
              )}

              {project.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedProject(project);
                    setNewProject(project);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No projects found. Create your first project!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
