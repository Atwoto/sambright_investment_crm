-- SIMPLIFIED PROJECTS MANAGER (NO PAGINATION)
-- Temporary version to test if pagination is causing the issue
-- Replace the contents of ProjectsManager.tsx with this if tests work

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

export function ProjectsManager_Simple() {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting to load data...');

      // Load clients first (smaller table, faster)
      console.log('Loading clients...');
      const clientsResult = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      console.log('Clients result:', clientsResult);

      if (clientsResult.error) {
        console.error('Clients error:', clientsResult.error);
        throw new Error(`Failed to load clients: ${clientsResult.error.message}`);
      }

      // Set clients data
      if (clientsResult.data) {
        setClients(clientsResult.data);
      }

      // Load projects with NO PAGINATION
      console.log('Loading projects...');
      const projectsResult = await supabase
        .from("projects")
        .select("id, project_number, name, client_id, description, project_type, status, start_date, end_date, estimated_budget, actual_cost, location, notes, images, video_link, created_at, color_palette")
        .order("created_at", { ascending: false });

      console.log('Projects result:', projectsResult);

      if (projectsResult.error) {
        console.error('Projects error:', projectsResult.error);
        throw new Error(`Failed to load projects: ${projectsResult.error.message}`);
      }

      // Map projects data with client names from loaded clients
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

      console.log('Mapped projects:', mappedProjects);
      setProjects(mappedProjects);

    } catch (error: any) {
      console.error("Error loading projects:", error);
      setError(error.message || "Failed to load projects. Please try again.");
      setProjects([]);
    } finally {
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
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize border">
                    {project.status.replace("_", " ")}
                  </Badge>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 && !loading && !error && (
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
    </div>
  );
}
