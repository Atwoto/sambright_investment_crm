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
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { canAccess } from "../lib/permissions";
import { AccessDenied } from "./ui/AccessDenied";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
  color_palette?: string[];
}

export function ProjectsManager() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!canAccess(user?.role, location.pathname)) {
    return <AccessDenied />;
  }
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const projectsPerPage = 12;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Reset to first page when search or filter changes
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout after 60 seconds")), 60000)
    );

    try {
      // Step 1: Load clients first (smaller table, faster)
      const clientsResult = await Promise.race([
        supabase
          .from("clients")
          .select("id, name")
          .order("name"),
        timeoutPromise
      ]) as any;

      if (clientsResult.error) {
        throw new Error(`Failed to load clients: ${clientsResult.error.message}`);
      }

      console.log('✅ Clients loaded:', clientsResult.data?.length || 0, 'items');

      // Set clients data
      if (clientsResult.data) {
        setClients(clientsResult.data);
      }

      // Step 2: Load projects with pagination (SIMPLER - no JOIN initially)
      const from = (currentPage - 1) * projectsPerPage;
      const to = from + projectsPerPage - 1;

      let projectsQuery = supabase
        .from("projects")
        .select("id, project_number, name, client_id, description, project_type, status, start_date, end_date, estimated_budget, actual_cost, location, notes, images, video_link, created_at, color_palette", { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(from, to);

      // Filter by status for field users
      if (user?.role === "field") {
        projectsQuery = projectsQuery.eq("status", "in_progress");
      }

      console.log('🔄 Loading projects (range', from, 'to', to, ')...');
      const projectsResult = await Promise.race([
        projectsQuery,
        timeoutPromise
      ]) as any;

      console.log('✅ Projects query completed:', projectsResult);

      if (projectsResult.error) {
        console.error('❌ Projects error:', projectsResult.error);
        throw new Error(`Failed to load projects: ${projectsResult.error.message}`);
      }

      // Step 3: Map projects data with client names from loaded clients
      const mappedProjects = (projectsResult.data || []).map((p: any) => {
        const client = clientsResult.data?.find((c: any) => c.id === p.client_id);
        return {
          id: p.id,
          projectNumber: p.project_number,
          name: p.name,
          clientId: p.client_id,
          clientName: client?.name || "Unknown Client",
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
          color_palette: p.color_palette || [],
        };
      });

      setProjects(mappedProjects);
      setTotalProjects(projectsResult.count || 0);

    } catch (error: any) {
      console.error("❌ Error loading projects:", error);
      const errorMsg = error.message || "Failed to load projects. Please try again.";
      console.error('❌ Setting error state:', errorMsg);
      setError(errorMsg);
      setProjects([]);
      setTotalProjects(0);
    } finally {
      console.log('✅ loadData complete, setting loading to false');
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      (project.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (project.clientName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (project.projectNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );
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

      if (error) {
        throw error;
      }

      toast.success("Project created successfully", { id: toastId });
      setIsAddDialogOpen(false);
      setNewProject({});
      setSelectedFiles([]);
      // Reload data from first page to show the new project
      setCurrentPage(1);
      loadData();
    } catch (error: any) {
      console.error("Full error creating project:", error);
      const errorMsg = error?.message || error?.hint || "Unknown error";
      toast.error(`Database error: ${errorMsg}`, {
        id: toastId,
        duration: 6000,
      });
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
      // Reload data to refresh the list
      loadData();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project", { id: toastId });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planning: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      on_hold: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    } as const;

    return (
      <Badge variant="outline" className={cn("capitalize border", variants[status as keyof typeof variants] || "")}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "on_hold":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Briefcase className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Projects</h2>
          <p className="text-muted-foreground">
            Manage client projects and track progress
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col glass-panel border-white/20">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project for a client
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-y-4 gap-x-3 py-2 overflow-y-auto flex-1 pr-2">
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
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                  className="col-span-3 glass-input"
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
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                  className="col-span-3 glass-input"
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
                  className="col-span-3 glass-input"
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
                  className="col-span-3 glass-input"
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
                  className="col-span-3 glass-input"
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
                  className="col-span-3 h-20 glass-input"
                  placeholder="Project description..."
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4 mb-4">
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
                    className="cursor-pointer glass-input"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.length} image(s) selected (
                      {(
                        selectedFiles.reduce((sum, f) => sum + f.size, 0) /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB)
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
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
                  className="col-span-3 glass-input"
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
                  className="col-span-3 h-16 glass-input"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t border-white/10 mt-2 bg-background/50 backdrop-blur-md">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAddProject}
                disabled={saving}
                className="bg-primary text-white"
              >
                {saving ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 rounded-2xl animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects by name, client, number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input border-0 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {user?.role !== 'field' && (
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48 glass-input border-0 bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card p-12 text-center rounded-xl animate-in fade-in-50">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Loading projects...</h3>
          <p className="text-muted-foreground mt-1">Please wait while we fetch your projects</p>
          <p className="text-xs text-muted-foreground mt-2">This may take up to 60 seconds</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-card p-12 text-center rounded-xl animate-in fade-in-50 border-red-200 dark:border-red-800">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Error Loading Projects</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">{error}</p>
          <Button onClick={() => loadData()} className="mt-4 bg-primary text-white">
            Try Again
          </Button>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-enter" style={{ animationDelay: '200ms' }}>
        {filteredProjects.map((project, index) => (
          <div
            key={project.id}
            className="group glass-card rounded-xl p-0 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-enter"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {project.projectNumber}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      setSelectedProject(project);
                      setIsViewDialogOpen(true);
                    }}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedProject(project);
                      setNewProject(project);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(project.status)}
                <Badge variant="outline" className="capitalize">
                  {project.projectType}
                </Badge>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-primary/60" />
                  <span className="text-foreground font-medium">{project.clientName}</span>
                </div>

                {project.location && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    <span className="truncate">{project.location}</span>
                  </div>
                )}

                {project.startDate && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary/60" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()}
                      {project.endDate &&
                        ` - ${new Date(project.endDate).toLocaleDateString()}`}
                    </span>
                  </div>
                )}

                {project.estimatedBudget && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-primary/60" />
                    <span className="text-foreground font-semibold">
                      {formatCurrency(project.estimatedBudget)}
                    </span>
                  </div>
                )}
              </div>

              {/* Media indicators */}
              {((project.images?.length ?? 0) > 0 || project.videoLink) && (
                <div className="flex gap-2 pt-2">
                  {project.images && project.images.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {project.images.length} {project.images.length === 1 ? "image" : "images"}
                    </Badge>
                  )}
                  {project.videoLink && (
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="glass-card p-12 text-center rounded-xl">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No projects found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
            Get started by creating a new project for one of your clients.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 bg-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalProjects > projectsPerPage && (
        <div className="flex items-center justify-between glass-card p-4 rounded-xl">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * projectsPerPage + 1, totalProjects)} to {Math.min(currentPage * projectsPerPage, totalProjects)} of {totalProjects} projects
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(prev => Math.max(prev - 1, 1));
                loadData();
              }}
              disabled={currentPage === 1}
              className="glass-input"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(totalProjects / projectsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(prev => prev + 1);
                loadData();
              }}
              disabled={currentPage >= Math.ceil(totalProjects / projectsPerPage)}
              className="glass-input"
            >
              Next
            </Button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-panel border-white/20">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3 text-2xl">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <div>
                    <div>{selectedProject.name}</div>
                    <div className="text-sm text-muted-foreground font-normal mt-1">
                      {selectedProject.projectNumber}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-8 mt-4">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Project Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        {getStatusBadge(selectedProject.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Type</span>
                        <Badge variant="outline" className="capitalize">{selectedProject.projectType}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Client Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {selectedProject.clientName}
                        </span>
                      </div>
                      {selectedProject.location && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">
                            {selectedProject.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(selectedProject.startDate || selectedProject.endDate) && (
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Timeline</h4>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'}
                          {' - '}
                          {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedProject.estimatedBudget && (
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Financials</h4>
                      <div className="flex items-center gap-3 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-bold text-lg">
                          {formatCurrency(selectedProject.estimatedBudget)}
                        </span>
                        <span className="text-xs text-muted-foreground">(Estimated)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedProject.description && (
                  <div className="glass-card p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Description</h4>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {selectedProject.description}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedProject.notes && (
                  <div className="glass-card p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Notes</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                      {selectedProject.notes}
                    </p>
                  </div>
                )}

                {/* Color Palette */}
                {selectedProject.color_palette && selectedProject.color_palette.length > 0 && (
                  <div className="glass-card p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Selected Color Palette</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedProject.color_palette.map((color, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="pl-8 pr-4 py-2 text-sm bg-background/50 backdrop-blur-sm border-border/50"
                        >
                          <div
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Gallery */}
                {selectedProject.images && selectedProject.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Project Gallery</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedProject.images.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group cursor-pointer"
                          onClick={() => setViewImage(img)}
                        >
                          <img
                            src={img}
                            alt={`Project image ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="text-white opacity-0 group-hover:opacity-100 h-8 w-8 drop-shadow-lg transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {viewImage && (
              <img
                src={viewImage}
                alt="Full size view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
