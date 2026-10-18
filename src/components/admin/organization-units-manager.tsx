"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Building,
  Plus,
  Trash2,
  Edit3,
  Shield,
  Users,
  MapPin,
  Globe,
  SlidersHorizontal,
  Filter,
  X,
  Layers,
  UserCheck,
  FolderTree,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { roleLabel } from "@/lib/roles";
import { OrgBulkImportModal, TemplateCol } from "@/components/admin/org-bulk-import-modal";

export type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string | null;
  organizationId?: string | null;
  franchiseId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
};

export type OrganizationItem = {
  id: string;
  name: string;
  code: string;
  domain: string | null;
  whiteLabelAdminId: string | null;
  whiteLabelAdmin: OrgUser | null;
  status: string;
  _count?: { franchises: number; users: number };
};

export type FranchiseItem = {
  id: string;
  name: string;
  code: string;
  organizationId: string | null;
  organization: { id: string; name: string } | null;
  franchiseAdminId: string | null;
  franchiseAdmin: OrgUser | null;
  location: string | null;
  status: string;
  _count?: { branches: number; users: number };
};

export type BranchItem = {
  id: string;
  name: string;
  code: string;
  franchiseId: string | null;
  franchise: { id: string; name: string; organizationId?: string | null; organization?: { id: string; name: string } } | null;
  branchManagerId: string | null;
  branchManager: OrgUser | null;
  city: string | null;
  status: string;
  _count?: { departments: number; users: number };
};

export type DepartmentItem = {
  id: string;
  name: string;
  code: string;
  branchId: string | null;
  branch: { id: string; name: string; franchiseId?: string | null; franchise?: { id: string; name: string; organizationId?: string | null } } | null;
  departmentHeadId: string | null;
  departmentHead: OrgUser | null;
  status: string;
  _count?: { teams: number; users: number };
};

export type TeamItem = {
  id: string;
  name: string;
  code: string;
  departmentId: string | null;
  department: { id: string; name: string; branchId?: string | null; branch?: { id: string; name: string; franchiseId?: string | null; franchise?: { id: string; name: string; organizationId?: string | null } } } | null;
  teamLeaderId: string | null;
  teamLeader: OrgUser | null;
  status: string;
  _count?: { users: number };
};

type Props = {
  organizations: OrganizationItem[];
  franchises: FranchiseItem[];
  branches: BranchItem[];
  departments: DepartmentItem[];
  teams: TeamItem[];
  allUsers: OrgUser[];
};

export const ROLE_MATRIX_DATA = [
  { role: "Super Admin", roleKey: "SUPERADMIN", hierarchy: "Platform", usersMgmt: "Full", roles: "Full", crm: "Full", reports: "Full", settings: "Full", billing: "Full", marketplace: "All", demo: "No", scope: "Global (GLB)" },
  { role: "Platform Admin", roleKey: "PLATFORM_ADMIN", hierarchy: "Platform", usersMgmt: "Full", roles: "Edit", crm: "Full", reports: "Full", settings: "Limited", billing: "Limited", marketplace: "All", demo: "No", scope: "Organization (ORG)" },
  { role: "White Label Admin", roleKey: "WHITE_LABEL_ADMIN", hierarchy: "Tenant", usersMgmt: "Tenant", roles: "Tenant", crm: "Full", reports: "Full", settings: "Brand", billing: "Tenant", marketplace: "Own Tenant", demo: "No", scope: "Organization (ORG)" },
  { role: "Franchise Admin", roleKey: "FRANCHISE_ADMIN", hierarchy: "Franchise", usersMgmt: "Franchise", roles: "Assign", crm: "Full", reports: "Full", settings: "Limited", billing: "No", marketplace: "Franchise", demo: "No", scope: "Franchise (FR)" },
  { role: "Branch Manager", roleKey: "BRANCH_MANAGER", hierarchy: "Branch", usersMgmt: "Branch", roles: "No", crm: "Team", reports: "Branch", settings: "No", billing: "No", marketplace: "Branch", demo: "No", scope: "Branch (BR)" },
  { role: "Department Head", roleKey: "DEPARTMENT_HEAD", hierarchy: "Department", usersMgmt: "No", roles: "No", crm: "Dept", reports: "Dept", settings: "No", billing: "No", marketplace: "Dept", demo: "No", scope: "Department (DEPT)" },
  { role: "Team Leader", roleKey: "TEAM_LEADER", hierarchy: "Team", usersMgmt: "No", roles: "No", crm: "Team", reports: "Team", settings: "No", billing: "No", marketplace: "Team", demo: "No", scope: "Team (TEAM)" },
  { role: "Executive / Staff", roleKey: "EXECUTIVE", hierarchy: "Employee", usersMgmt: "No", roles: "No", crm: "Own", reports: "Own", settings: "No", billing: "No", marketplace: "Own", demo: "No", scope: "Own (OWN)" },
  { role: "Buyer / Client", roleKey: "BUYER", hierarchy: "Customer", usersMgmt: "No", roles: "No", crm: "Own Profile", reports: "Own", settings: "No", billing: "Own", marketplace: "Buy/View", demo: "No", scope: "Own (OWN)" },
  { role: "Seller / Vendor", roleKey: "SELLER", hierarchy: "Customer", usersMgmt: "No", roles: "No", crm: "Own Store", reports: "Own", settings: "Store", billing: "Own", marketplace: "Sell/Orders", demo: "No", scope: "Own (OWN)" },
  { role: "Demo User", roleKey: "DEMO", hierarchy: "Guest", usersMgmt: "No", roles: "No", crm: "Read Only Demo", reports: "Sample", settings: "No", billing: "No", marketplace: "Sandbox Only", demo: "Yes", scope: "Sandbox (SANDBOX)" },
];

export function OrganizationUnitsManager({
  organizations: initialOrgs,
  franchises: initialFranchises,
  branches: initialBranches,
  departments: initialDepts,
  teams: initialTeams,
  allUsers,
}: Props) {
  const router = useRouter();
  // Order: White Labels, Franchises, Branches, Departments, Teams, Matrix
  const [activeTab, setActiveTab] = useState<"orgs" | "franchises" | "branches" | "depts" | "teams" | "matrix">("orgs");
  
  const [orgs, setOrgs] = useState(initialOrgs);
  const [franchises, setFranchises] = useState(initialFranchises);
  const [branches, setBranches] = useState(initialBranches);
  const [depts, setDepts] = useState(initialDepts);
  const [teams, setTeams] = useState(initialTeams);

  // Hierarchy Filter State: White Label -> Franchise -> Branch -> Department -> Team
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("");
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] = useState<string>("");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("");

  // Folder Structure Tree View State
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [treeSearchQuery, setTreeSearchQuery] = useState("");

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAllNodes = () => {
    const allIds: Record<string, boolean> = {};
    orgs.forEach((o) => (allIds[o.id] = true));
    franchises.forEach((f) => (allIds[f.id] = true));
    branches.forEach((b) => (allIds[b.id] = true));
    depts.forEach((d) => (allIds[d.id] = true));
    setExpandedNodes(allIds);
  };

  const collapseAllNodes = () => {
    setExpandedNodes({});
  };

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAllUsersOverride, setShowAllUsersOverride] = useState(false);

  // Export / Bulk upload
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Per-tab config for export + bulk upload (not applicable to the matrix tab).
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case "orgs":
        return {
          actionType: "ORGANIZATION",
          label: "White Label",
          template: [
            { header: "Name", example: "Acme Realty" },
            { header: "Code", example: "WL-ACME" },
            { header: "Domain", example: "acme.plotsnhomes.com" },
            { header: "Status", example: "ACTIVE" },
          ] as TemplateCol[],
          parentHint: "",
          rows: () => orgs.map((o) => ({
            Code: o.code, Name: o.name, Domain: o.domain ?? "",
            "White Label Admin": o.whiteLabelAdmin?.name ?? "Unassigned",
            Franchises: o._count?.franchises ?? 0, Users: o._count?.users ?? 0, Status: o.status,
          })),
        };
      case "franchises":
        return {
          actionType: "FRANCHISE",
          label: "Franchise",
          template: [
            { header: "Name", example: "West Coast Franchise" },
            { header: "Code", example: "FR-WEST" },
            { header: "Organization", example: "Acme Realty" },
            { header: "Location", example: "Mumbai" },
            { header: "Status", example: "ACTIVE" },
          ] as TemplateCol[],
          parentHint: "The 'Organization' column must match an existing White Label name (leave blank to skip linking).",
          rows: () => franchises.map((f) => ({
            Code: f.code, Name: f.name, Organization: f.organization?.name ?? "",
            "Franchise Admin": f.franchiseAdmin?.name ?? "Unassigned",
            Location: f.location ?? "", Branches: f._count?.branches ?? 0, Users: f._count?.users ?? 0, Status: f.status,
          })),
        };
      case "branches":
        return {
          actionType: "BRANCH",
          label: "Branch",
          template: [
            { header: "Name", example: "Mumbai West Branch" },
            { header: "Code", example: "BR-MUM-WEST" },
            { header: "Franchise", example: "West Coast Franchise" },
            { header: "City", example: "Mumbai" },
            { header: "Status", example: "ACTIVE" },
          ] as TemplateCol[],
          parentHint: "The 'Franchise' column must match an existing Franchise name (leave blank to skip linking).",
          rows: () => branches.map((b) => ({
            Code: b.code, Name: b.name, Franchise: b.franchise?.name ?? "",
            "Branch Manager": b.branchManager?.name ?? "Unassigned",
            City: b.city ?? "", Departments: b._count?.departments ?? 0, Users: b._count?.users ?? 0, Status: b.status,
          })),
        };
      case "depts":
        return {
          actionType: "DEPARTMENT",
          label: "Department",
          template: [
            { header: "Name", example: "Sales Department" },
            { header: "Code", example: "DEPT-SALES" },
            { header: "Branch", example: "Mumbai West Branch" },
            { header: "Status", example: "ACTIVE" },
          ] as TemplateCol[],
          parentHint: "The 'Branch' column must match an existing Branch name (leave blank to skip linking).",
          rows: () => depts.map((d) => ({
            Code: d.code, Name: d.name, Branch: d.branch?.name ?? "",
            "Department Head": d.departmentHead?.name ?? "Unassigned",
            Teams: d._count?.teams ?? 0, Users: d._count?.users ?? 0, Status: d.status,
          })),
        };
      case "teams":
        return {
          actionType: "TEAM",
          label: "Team",
          template: [
            { header: "Name", example: "Team Alpha" },
            { header: "Code", example: "TEAM-ALPHA" },
            { header: "Department", example: "Sales Department" },
            { header: "Status", example: "ACTIVE" },
          ] as TemplateCol[],
          parentHint: "The 'Department' column must match an existing Department name (leave blank to skip linking).",
          rows: () => teams.map((t) => ({
            Code: t.code, Name: t.name, Department: t.department?.name ?? "",
            "Team Leader": t.teamLeader?.name ?? "Unassigned",
            Users: t._count?.users ?? 0, Status: t.status,
          })),
        };
      default:
        return null;
    }
  }, [activeTab, orgs, franchises, branches, depts, teams]);

  async function exportCurrentTab(format: "xlsx" | "csv") {
    setExportOpen(false);
    if (!tabConfig) return;
    const XLSX = await import("xlsx");
    const rows = tabConfig.rows();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "No records" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabConfig.label.slice(0, 28));
    const date = new Date().toISOString().slice(0, 10);
    const slug = tabConfig.label.toLowerCase().replace(/\s+/g, "-");
    XLSX.writeFile(wb, `plotsnhomes-${slug}-${date}.${format}`, { bookType: format });
  }

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formLeaderId, setFormLeaderId] = useState("");
  
  // Multi-Level Parent IDs
  const [formOrgId, setFormOrgId] = useState("");
  const [formFranchiseId, setFormFranchiseId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formDeptId, setFormDeptId] = useState("");

  // Cascading Filter Handlers (Team -> Dept -> Branch -> Franchise -> Org)
  function handleTeamFilterChange(teamId: string) {
    setSelectedTeamFilter(teamId);
    if (teamId) {
      const matchTeam = teams.find((t) => t.id === teamId);
      if (matchTeam && matchTeam.departmentId) {
        setSelectedDeptFilter(matchTeam.departmentId);
        const matchDept = depts.find((d) => d.id === matchTeam.departmentId);
        if (matchDept && matchDept.branchId) {
          setSelectedBranchFilter(matchDept.branchId);
          const matchBranch = branches.find((b) => b.id === matchDept.branchId);
          if (matchBranch && matchBranch.franchiseId) {
            setSelectedFranchiseFilter(matchBranch.franchiseId);
            const parentOrgId = matchBranch.franchise?.organizationId;
            if (parentOrgId) setSelectedOrgFilter(parentOrgId);
          }
        }
      }
    }
  }

  function handleDeptFilterChange(deptId: string) {
    setSelectedDeptFilter(deptId);
    setSelectedTeamFilter("");
    if (deptId) {
      const match = depts.find((d) => d.id === deptId);
      if (match) {
        if (match.branchId) setSelectedBranchFilter(match.branchId);
        const parentFranchiseId = match.branch?.franchiseId;
        if (parentFranchiseId) setSelectedFranchiseFilter(parentFranchiseId);
        const parentOrgId = match.branch?.franchise?.organizationId;
        if (parentOrgId) setSelectedOrgFilter(parentOrgId);
      }
    }
  }

  function handleBranchFilterChange(branchId: string) {
    setSelectedBranchFilter(branchId);
    setSelectedDeptFilter("");
    setSelectedTeamFilter("");
    if (branchId) {
      const match = branches.find((b) => b.id === branchId);
      if (match) {
        if (match.franchiseId) setSelectedFranchiseFilter(match.franchiseId);
        const parentOrgId = match.franchise?.organizationId;
        if (parentOrgId) setSelectedOrgFilter(parentOrgId);
      }
    }
  }

  function handleFranchiseFilterChange(franchiseId: string) {
    setSelectedFranchiseFilter(franchiseId);
    setSelectedBranchFilter("");
    setSelectedDeptFilter("");
    setSelectedTeamFilter("");
    if (franchiseId) {
      const match = franchises.find((f) => f.id === franchiseId);
      if (match && match.organizationId) {
        setSelectedOrgFilter(match.organizationId);
      }
    }
  }

  function handleOrgFilterChange(orgId: string) {
    setSelectedOrgFilter(orgId);
    setSelectedFranchiseFilter("");
    setSelectedBranchFilter("");
    setSelectedDeptFilter("");
    setSelectedTeamFilter("");
  }

  function clearAllFilters() {
    setSelectedTeamFilter("");
    setSelectedDeptFilter("");
    setSelectedBranchFilter("");
    setSelectedFranchiseFilter("");
    setSelectedOrgFilter("");
  }

  const isFilterActive = Boolean(
    selectedTeamFilter || selectedDeptFilter || selectedBranchFilter || selectedFranchiseFilter || selectedOrgFilter
  );

  // Available Filter Options
  const availableFranchisesForFilter = useMemo(() => {
    if (!selectedOrgFilter) return franchises;
    return franchises.filter((f) => f.organizationId === selectedOrgFilter);
  }, [franchises, selectedOrgFilter]);

  const availableBranchesForFilter = useMemo(() => {
    let list = branches;
    if (selectedFranchiseFilter) {
      list = list.filter((b) => b.franchiseId === selectedFranchiseFilter);
    } else if (selectedOrgFilter) {
      list = list.filter((b) => {
        if (b.franchise?.organizationId) return b.franchise.organizationId === selectedOrgFilter;
        if ((b as any).organizationId) return (b as any).organizationId === selectedOrgFilter;
        if (b.franchiseId) {
          const f = franchises.find((item) => item.id === b.franchiseId);
          return f?.organizationId === selectedOrgFilter;
        }
        return false;
      });
    }
    return list;
  }, [branches, franchises, selectedFranchiseFilter, selectedOrgFilter]);

  const availableDeptsForFilter = useMemo(() => {
    let list = depts;
    if (selectedBranchFilter) {
      list = list.filter((d) => d.branchId === selectedBranchFilter);
    } else if (selectedFranchiseFilter) {
      list = list.filter((d) => {
        if (d.branch?.franchiseId) return d.branch.franchiseId === selectedFranchiseFilter;
        if (d.branchId) {
          const b = branches.find((item) => item.id === d.branchId);
          return b?.franchiseId === selectedFranchiseFilter;
        }
        return false;
      });
    } else if (selectedOrgFilter) {
      list = list.filter((d) => {
        if (d.branch?.franchise?.organizationId) return d.branch.franchise.organizationId === selectedOrgFilter;
        if (d.branchId) {
          const b = branches.find((item) => item.id === d.branchId);
          if (b?.franchise?.organizationId) return b.franchise.organizationId === selectedOrgFilter;
          if (b?.franchiseId) {
            const f = franchises.find((item) => item.id === b.franchiseId);
            return f?.organizationId === selectedOrgFilter;
          }
        }
        return false;
      });
    }
    return list;
  }, [depts, branches, franchises, selectedBranchFilter, selectedFranchiseFilter, selectedOrgFilter]);

  const availableTeamsForFilter = useMemo(() => {
    let list = teams;
    if (selectedDeptFilter) {
      list = list.filter((t) => t.departmentId === selectedDeptFilter);
    } else if (selectedBranchFilter) {
      list = list.filter((t) => {
        if (t.department?.branchId) return t.department.branchId === selectedBranchFilter;
        if (t.departmentId) {
          const d = depts.find((item) => item.id === t.departmentId);
          return d?.branchId === selectedBranchFilter;
        }
        return false;
      });
    } else if (selectedFranchiseFilter) {
      list = list.filter((t) => {
        if (t.department?.branch?.franchiseId) return t.department.branch.franchiseId === selectedFranchiseFilter;
        if (t.departmentId) {
          const d = depts.find((item) => item.id === t.departmentId);
          if (d?.branch?.franchiseId) return d.branch.franchiseId === selectedFranchiseFilter;
          if (d?.branchId) {
            const b = branches.find((item) => item.id === d.branchId);
            return b?.franchiseId === selectedFranchiseFilter;
          }
        }
        return false;
      });
    } else if (selectedOrgFilter) {
      list = list.filter((t) => {
        if (t.department?.branch?.franchise?.organizationId) return t.department.branch.franchise.organizationId === selectedOrgFilter;
        if (t.departmentId) {
          const d = depts.find((item) => item.id === t.departmentId);
          if (d?.branchId) {
            const b = branches.find((item) => item.id === d.branchId);
            if (b?.franchiseId) {
              const f = franchises.find((item) => item.id === b.franchiseId);
              return f?.organizationId === selectedOrgFilter;
            }
          }
        }
        return false;
      });
    }
    return list;
  }, [teams, depts, branches, franchises, selectedDeptFilter, selectedBranchFilter, selectedFranchiseFilter, selectedOrgFilter]);

  // Filtered Cards Lists
  const displayedTeams = useMemo(() => {
    let list = teams;
    if (selectedTeamFilter) {
      list = list.filter((t) => t.id === selectedTeamFilter);
    } else if (selectedDeptFilter) {
      list = list.filter((t) => t.departmentId === selectedDeptFilter);
    } else if (selectedBranchFilter) {
      list = list.filter((t) => t.department?.branchId === selectedBranchFilter);
    } else if (selectedFranchiseFilter) {
      list = list.filter((t) => t.department?.branch?.franchiseId === selectedFranchiseFilter);
    } else if (selectedOrgFilter) {
      list = list.filter((t) => t.department?.branch?.franchise?.organizationId === selectedOrgFilter);
    }
    return list;
  }, [teams, selectedTeamFilter, selectedDeptFilter, selectedBranchFilter, selectedFranchiseFilter, selectedOrgFilter]);

  const displayedDepts = useMemo(() => {
    let list = depts;
    if (selectedDeptFilter) {
      list = list.filter((d) => d.id === selectedDeptFilter);
    } else if (selectedBranchFilter) {
      list = list.filter((d) => d.branchId === selectedBranchFilter);
    } else if (selectedFranchiseFilter) {
      list = list.filter((d) => d.branch?.franchiseId === selectedFranchiseFilter);
    } else if (selectedOrgFilter) {
      list = list.filter((d) => d.branch?.franchise?.organizationId === selectedOrgFilter);
    }
    return list;
  }, [depts, selectedDeptFilter, selectedBranchFilter, selectedFranchiseFilter, selectedOrgFilter]);

  const displayedBranches = useMemo(() => {
    let list = branches;
    if (selectedBranchFilter) {
      list = list.filter((b) => b.id === selectedBranchFilter);
    } else if (selectedFranchiseFilter) {
      list = list.filter((b) => b.franchiseId === selectedFranchiseFilter);
    } else if (selectedOrgFilter) {
      list = list.filter((b) => b.franchise?.organizationId === selectedOrgFilter);
    }
    return list;
  }, [branches, selectedBranchFilter, selectedFranchiseFilter, selectedOrgFilter]);

  const displayedFranchises = useMemo(() => {
    let list = franchises;
    if (selectedFranchiseFilter) {
      list = list.filter((f) => f.id === selectedFranchiseFilter);
    } else if (selectedOrgFilter) {
      list = list.filter((f) => f.organizationId === selectedOrgFilter);
    }
    return list;
  }, [franchises, selectedFranchiseFilter, selectedOrgFilter]);

  const displayedOrgs = useMemo(() => {
    if (!selectedOrgFilter) return orgs;
    return orgs.filter((o) => o.id === selectedOrgFilter);
  }, [orgs, selectedOrgFilter]);

  // Singular Tab Label
  const tabSingularLabel = useMemo(() => {
    switch (activeTab) {
      case "orgs": return "White Label Tenant";
      case "franchises": return "Franchise";
      case "branches": return "Branch";
      case "depts": return "Department";
      case "teams": return "Team";
      default: return "Unit";
    }
  }, [activeTab]);

  // Modal Cascading Selectors
  const filteredFranchises = useMemo(() => {
    if (!formOrgId) return franchises;
    return franchises.filter((f) => !f.organizationId || f.organizationId === formOrgId);
  }, [franchises, formOrgId]);

  const franchiseOptions = useMemo(() => [
    { value: "", label: "Direct Branch (No Franchise)" },
    ...filteredFranchises.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` })),
  ], [filteredFranchises]);

  const filteredBranches = useMemo(() => {
    let list = branches;
    if (formFranchiseId) {
      list = list.filter((b) => b.franchiseId === formFranchiseId);
    } else if (formOrgId) {
      list = list.filter((b) => !b.franchise || b.franchise.organizationId === formOrgId);
    }
    return list;
  }, [branches, formFranchiseId, formOrgId]);

  const branchOptions = useMemo(() => [
    { value: "", label: "Global Department (No Branch)" },
    ...filteredBranches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
  ], [filteredBranches]);

  const filteredDepts = useMemo(() => {
    let list = depts;
    if (formBranchId) {
      list = list.filter((d) => d.branchId === formBranchId);
    } else if (formFranchiseId) {
      list = list.filter((d) => !d.branch || d.branch.franchiseId === formFranchiseId);
    } else if (formOrgId) {
      list = list.filter((d) => !d.branch?.franchise || d.branch.franchise.organizationId === formOrgId);
    }
    return list;
  }, [depts, formBranchId, formFranchiseId, formOrgId]);

  const deptOptions = useMemo(() => [
    { value: "", label: "General Team (No Department)" },
    ...filteredDepts.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
  ], [filteredDepts]);

  function handleOrgChange(newOrgId: string) {
    setFormOrgId(newOrgId);
    if (formFranchiseId) {
      const match = franchises.find((f) => f.id === formFranchiseId);
      if (match && match.organizationId && match.organizationId !== newOrgId) {
        setFormFranchiseId("");
        setFormBranchId("");
        setFormDeptId("");
      }
    }
  }

  function handleFranchiseChange(newFranchiseId: string) {
    setFormFranchiseId(newFranchiseId);
    if (newFranchiseId) {
      const match = franchises.find((f) => f.id === newFranchiseId);
      if (match && match.organizationId && match.organizationId !== formOrgId) {
        setFormOrgId(match.organizationId);
      }
    }
    if (formBranchId) {
      const matchBranch = branches.find((b) => b.id === formBranchId);
      if (matchBranch && matchBranch.franchiseId && matchBranch.franchiseId !== newFranchiseId) {
        setFormBranchId("");
        setFormDeptId("");
      }
    }
  }

  function handleBranchChange(newBranchId: string) {
    setFormBranchId(newBranchId);
    if (newBranchId) {
      const matchBranch = branches.find((b) => b.id === newBranchId);
      if (matchBranch) {
        if (matchBranch.franchiseId && matchBranch.franchiseId !== formFranchiseId) {
          setFormFranchiseId(matchBranch.franchiseId);
        }
        const parentOrgId = matchBranch.franchise?.organizationId;
        if (parentOrgId && parentOrgId !== formOrgId) {
          setFormOrgId(parentOrgId);
        }
      }
    }
    if (formDeptId) {
      const matchDept = depts.find((d) => d.id === formDeptId);
      if (matchDept && matchDept.branchId && matchDept.branchId !== newBranchId) {
        setFormDeptId("");
      }
    }
  }

  function handleDeptChange(newDeptId: string) {
    setFormDeptId(newDeptId);
    if (newDeptId) {
      const matchDept = depts.find((d) => d.id === newDeptId);
      if (matchDept && matchDept.branchId) {
        if (matchDept.branchId !== formBranchId) {
          setFormBranchId(matchDept.branchId);
        }
        const parentFranchiseId = matchDept.branch?.franchiseId;
        if (parentFranchiseId && parentFranchiseId !== formFranchiseId) {
          setFormFranchiseId(parentFranchiseId);
        }
        const parentOrgId = matchDept.branch?.franchise?.organizationId;
        if (parentOrgId && parentOrgId !== formOrgId) {
          setFormOrgId(parentOrgId);
        }
      }
    }
  }

  // Filtered Leader Options
  const userOptions = useMemo(() => {
    let relevantRoles: string[] = [];
    if (activeTab === "teams") {
      relevantRoles = ["DEPARTMENT_HEAD", "TEAM_LEADER", "EXECUTIVE", "EMPLOYEE", "AGENT"];
    } else if (activeTab === "depts") {
      relevantRoles = ["BRANCH_MANAGER", "DEPARTMENT_HEAD"];
    } else if (activeTab === "branches") {
      relevantRoles = ["FRANCHISE_ADMIN", "BRANCH_MANAGER"];
    } else if (activeTab === "franchises") {
      relevantRoles = ["SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN", "FRANCHISE_ADMIN"];
    } else if (activeTab === "orgs") {
      relevantRoles = ["SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN"];
    }

    let eligible = allUsers;

    if (!showAllUsersOverride) {
      if (relevantRoles.length > 0) {
        eligible = eligible.filter((u) => relevantRoles.includes(u.role));
      }
      if (formOrgId) {
        eligible = eligible.filter((u) => {
          const uOrgId = u.tenantId || u.organizationId;
          return !uOrgId || uOrgId === formOrgId || ["SUPERADMIN", "PLATFORM_ADMIN"].includes(u.role);
        });
      }
      if (formFranchiseId) {
        eligible = eligible.filter((u) => !u.franchiseId || u.franchiseId === formFranchiseId || ["SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN"].includes(u.role));
      }
      if (formBranchId) {
        eligible = eligible.filter((u) => !u.branchId || u.branchId === formBranchId || ["SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN", "FRANCHISE_ADMIN"].includes(u.role));
      }
      if (formDeptId) {
        eligible = eligible.filter((u) => !u.departmentId || u.departmentId === formDeptId || ["SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN", "FRANCHISE_ADMIN", "BRANCH_MANAGER"].includes(u.role));
      }
    }

    return [
      { value: "", label: "Unassigned (Select Relevant Leader)" },
      ...eligible.map((u) => ({
        value: u.id,
        label: `${u.name} (${roleLabel(u.role as any)})`,
        sublabel: u.email,
      })),
    ];
  }, [allUsers, activeTab, formOrgId, formFranchiseId, formBranchId, formDeptId, showAllUsersOverride]);

  function openCreateModal() {
    setEditingItem(null);
    setShowAllUsersOverride(false);
    setFormName("");
    setFormCode(`${activeTab.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDomain("");
    setFormLocation("");
    setFormCity("");
    setFormLeaderId("");
    setFormOrgId(orgs[0]?.id || "");
    setFormFranchiseId(franchises[0]?.id || "");
    setFormBranchId(branches[0]?.id || "");
    setFormDeptId(depts[0]?.id || "");
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(item: any) {
    setEditingItem(item);
    setShowAllUsersOverride(false);
    setFormName(item.name || "");
    setFormCode(item.code || "");
    setFormDomain(item.domain || "");
    setFormLocation(item.location || "");
    setFormCity(item.city || "");
    setFormLeaderId(
      item.whiteLabelAdminId ||
      item.franchiseAdminId ||
      item.branchManagerId ||
      item.departmentHeadId ||
      item.teamLeaderId ||
      ""
    );

    const parentOrg = item.organizationId || item.franchise?.organizationId || item.branch?.franchise?.organizationId || item.department?.branch?.franchise?.organizationId || orgs[0]?.id || "";
    const parentFranchise = item.franchiseId || item.branch?.franchiseId || item.department?.branch?.franchiseId || franchises[0]?.id || "";
    const parentBranch = item.branchId || item.department?.branchId || branches[0]?.id || "";
    const parentDept = item.departmentId || depts[0]?.id || "";

    setFormOrgId(parentOrg);
    setFormFranchiseId(parentFranchise);
    setFormBranchId(parentBranch);
    setFormDeptId(parentDept);
    
    setError("");
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formCode.trim()) {
      setError("Name and Code are required.");
      return;
    }

    // Name validation: no numbers allowed
    if (/\d/.test(formName.trim())) {
      setError("Name must not contain numbers.");
      return;
    }

    // Name validation: max 30 words
    const nameWords = formName.trim().split(/\s+/).filter((w: string) => w.length > 0);
    if (nameWords.length > 30) {
      setError(`Name cannot exceed 30 words (currently ${nameWords.length}).`);
      return;
    }

    setBusy(true);
    setError("");
    setMsg("");

    let actionType: any = "TEAM";
    let dataPayload: any = {
      id: editingItem?.id,
      name: formName.trim(),
      code: formCode.trim(),
      status: "ACTIVE",
    };

    if (activeTab === "orgs") {
      actionType = "ORGANIZATION";
      dataPayload.domain = formDomain.trim();
      dataPayload.whiteLabelAdminId = formLeaderId;
    } else if (activeTab === "franchises") {
      actionType = "FRANCHISE";
      dataPayload.organizationId = formOrgId;
      dataPayload.franchiseAdminId = formLeaderId;
      dataPayload.location = formLocation.trim();
    } else if (activeTab === "branches") {
      actionType = "BRANCH";
      dataPayload.franchiseId = formFranchiseId;
      dataPayload.branchManagerId = formLeaderId;
      dataPayload.city = formCity.trim();
    } else if (activeTab === "depts") {
      actionType = "DEPARTMENT";
      dataPayload.branchId = formBranchId;
      dataPayload.departmentHeadId = formLeaderId;
    } else if (activeTab === "teams") {
      actionType = "TEAM";
      dataPayload.departmentId = formDeptId;
      dataPayload.teamLeaderId = formLeaderId;
    }

    try {
      const res = await fetch("/api/admin/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, data: dataPayload }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save unit.");

      setMsg(`✓ Unit saved successfully.`);
      setIsModalOpen(false);
      router.refresh();

      if (activeTab === "orgs") {
        setOrgs((prev) =>
          editingItem ? prev.map((o) => (o.id === resData.item.id ? { ...o, ...resData.item } : o)) : [...prev, resData.item]
        );
      } else if (activeTab === "franchises") {
        setFranchises((prev) =>
          editingItem ? prev.map((f) => (f.id === resData.item.id ? { ...f, ...resData.item } : f)) : [...prev, resData.item]
        );
      } else if (activeTab === "branches") {
        setBranches((prev) =>
          editingItem ? prev.map((b) => (b.id === resData.item.id ? { ...b, ...resData.item } : b)) : [...prev, resData.item]
        );
      } else if (activeTab === "depts") {
        setDepts((prev) =>
          editingItem ? prev.map((d) => (d.id === resData.item.id ? { ...d, ...resData.item } : d)) : [...prev, resData.item]
        );
      } else if (activeTab === "teams") {
        setTeams((prev) =>
          editingItem ? prev.map((t) => (t.id === resData.item.id ? { ...t, ...resData.item } : t)) : [...prev, resData.item]
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(type: string, id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/organization?type=${type}&id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      
      setMsg(`✓ ${name} deleted.`);
      if (type === "ORGANIZATION") setOrgs((prev) => prev.filter((i) => i.id !== id));
      if (type === "FRANCHISE") setFranchises((prev) => prev.filter((i) => i.id !== id));
      if (type === "BRANCH") setBranches((prev) => prev.filter((i) => i.id !== id));
      if (type === "DEPARTMENT") setDepts((prev) => prev.filter((i) => i.id !== id));
      if (type === "TEAM") setTeams((prev) => prev.filter((i) => i.id !== id));

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete unit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Summary - Reordered starting with White Labels and ending with Teams */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <div
          onClick={() => setActiveTab("orgs")}
          className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "orgs"
              ? "border-purple-400 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "orgs" ? "text-purple-700 dark:text-purple-400" : "text-slate-500 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-purple-400"
            }`}>
              WHITE LABELS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "orgs" ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-purple-100 group-hover:text-purple-700 dark:group-hover:bg-purple-900/60 dark:group-hover:text-purple-300"
            }`}>
              {orgs.length} Tenants
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{orgs.length}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            White label tenant brand instances
          </p>
        </div>

        <div
          onClick={() => setActiveTab("franchises")}
          className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "franchises"
              ? "border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "franchises" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
            }`}>
              FRANCHISES
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "franchises" ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:group-hover:bg-emerald-900/60 dark:group-hover:text-emerald-300"
            }`}>
              {franchises.length} Partners
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{franchises.length}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Regional franchise partner networks
          </p>
        </div>

        <div
          onClick={() => setActiveTab("branches")}
          className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "branches"
              ? "border-teal-400 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:bg-teal-50/40 dark:hover:bg-teal-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "branches" ? "text-teal-700 dark:text-teal-400" : "text-slate-500 dark:text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-400"
            }`}>
              BRANCHES
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "branches" ? "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-teal-100 group-hover:text-teal-700 dark:group-hover:bg-teal-900/60 dark:group-hover:text-teal-300"
            }`}>
              {branches.length} Offices
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{branches.length}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            City branch offices & locations
          </p>
        </div>

        <div
          onClick={() => setActiveTab("depts")}
          className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "depts"
              ? "border-blue-400 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "depts" ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400"
            }`}>
              DEPARTMENTS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "depts" ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900/60 dark:group-hover:text-blue-300"
            }`}>
              {depts.length} Divisions
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{depts.length}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Internal functional divisions
          </p>
        </div>

        <div
          onClick={() => setActiveTab("teams")}
          className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md ${
            activeTab === "teams"
              ? "border-amber-400 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${
              activeTab === "teams" ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400 group-hover:text-amber-800 dark:group-hover:text-amber-300"
            }`}>
              TEAMS
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeTab === "teams" ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-100 group-hover:text-amber-800 dark:group-hover:bg-amber-900/60 dark:group-hover:text-amber-300"
            }`}>
              {teams.length} Workgroups
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{teams.length}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Operational sales & support workgroups
          </p>
        </div>
      </div>

      {msg && <p className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">{msg}</p>}
      {error && <p className="p-3 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200">{error}</p>}

      {/* Tabs Header Row - Reordered starting with White Labels and ending with Teams */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("orgs")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === "orgs"
                ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs font-extrabold"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span>White Labels ({orgs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("franchises")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === "franchises"
                ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs font-extrabold"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold"
            }`}
          >
            <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Franchises ({franchises.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("branches")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === "branches"
                ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs font-extrabold"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>Branches ({branches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("depts")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === "depts"
                ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs font-extrabold"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold"
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Departments ({depts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === "teams"
                ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs font-extrabold"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Teams ({teams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === "matrix"
                ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-2xs font-extrabold"
                : "bg-white text-purple-700 hover:bg-purple-50 border border-purple-200 font-bold"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span>Role Matrix & Hierarchy</span>
          </button>
        </div>

        {activeTab !== "matrix" && (
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Folder Structure Icon Button */}
            <button
              type="button"
              onClick={() => {
                expandAllNodes();
                setIsTreeModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold px-3 py-1.5 text-xs border border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
              title="View Folder Structure Tree"
            >
              <FolderTree className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Folder Structure</span>
            </button>

            {/* Export dropdown */}
            {tabConfig && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold px-3 py-1.5 text-xs border border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
                  title="Export the current list"
                >
                  <Download className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Export</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                      <button type="button" onClick={() => exportCurrentTab("xlsx")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel (.xlsx)
                      </button>
                      <button type="button" onClick={() => exportCurrentTab("csv")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition border-t border-slate-100">
                        <FileText className="h-4 w-4 text-blue-600" /> CSV (.csv)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bulk Upload Button */}
            {tabConfig && (
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 text-xs border border-emerald-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
                title="Bulk upload from Excel / CSV"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span>Bulk Upload</span>
              </button>
            )}

            {/* + Add New Button */}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 text-xs border border-amber-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add New</span>
            </button>
          </div>
        )}
      </div>

      {tabConfig && (
        <OrgBulkImportModal
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          onImported={() => window.location.reload()}
          actionType={tabConfig.actionType}
          entityLabel={tabConfig.label}
          templateColumns={tabConfig.template}
          parentHint={tabConfig.parentHint}
        />
      )}

      {/* Plain White Hierarchy Scope Filter Bar */}
      {activeTab !== "matrix" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <Filter className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold tracking-wide text-slate-800">
                Filter Database Hierarchy Scopes
              </span>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {/* 1. WHITE LABEL TENANT DROPDOWN */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-purple-600" />
                WHITE LABEL TENANT
              </label>
              <select
                value={selectedOrgFilter}
                onChange={(e) => handleOrgFilterChange(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 font-semibold focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="">All White Labels ({orgs.length})</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    🏢 {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. FRANCHISE DROPDOWN */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Building className="h-3 w-3 text-emerald-600" />
                FRANCHISE
              </label>
              <select
                value={selectedFranchiseFilter}
                onChange={(e) => handleFranchiseFilterChange(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 font-semibold focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="">All Franchises ({availableFranchisesForFilter.length})</option>
                {availableFranchisesForFilter.map((f) => (
                  <option key={f.id} value={f.id}>
                    🏪 {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. CITY BRANCH DROPDOWN */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-teal-600" />
                CITY BRANCH
              </label>
              <select
                value={selectedBranchFilter}
                onChange={(e) => handleBranchFilterChange(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 font-semibold focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="">All Branches ({availableBranchesForFilter.length})</option>
                {availableBranchesForFilter.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. DEPARTMENT DROPDOWN */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-600" />
                DEPARTMENT
              </label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => handleDeptFilterChange(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 font-semibold focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="">All Departments ({availableDeptsForFilter.length})</option>
                {availableDeptsForFilter.map((d) => (
                  <option key={d.id} value={d.id}>
                    🛡️ {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 5. TEAM DROPDOWN */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Users className="h-3 w-3 text-indigo-600" />
                TEAM
              </label>
              <select
                value={selectedTeamFilter}
                onChange={(e) => handleTeamFilterChange(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-2 font-semibold focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
              >
                <option value="">All Teams ({availableTeamsForFilter.length})</option>
                {availableTeamsForFilter.map((t) => (
                  <option key={t.id} value={t.id}>
                    👥 {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Badges - Plain Light Styling */}
          {isFilterActive && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-200/80 text-xs">
              <span className="text-[11px] font-bold text-slate-600">Active Scope:</span>
              {selectedTeamFilter && (
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                  Team: {teams.find((t) => t.id === selectedTeamFilter)?.name}
                </span>
              )}
              {selectedDeptFilter && (
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                  Dept: {depts.find((d) => d.id === selectedDeptFilter)?.name}
                </span>
              )}
              {selectedBranchFilter && (
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                  Branch: {branches.find((b) => b.id === selectedBranchFilter)?.name}
                </span>
              )}
              {selectedFranchiseFilter && (
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                  Franchise: {franchises.find((f) => f.id === selectedFranchiseFilter)?.name}
                </span>
              )}
              {selectedOrgFilter && (
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                  Org: {orgs.find((o) => o.id === selectedOrgFilter)?.name}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content Cards View */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs min-h-[350px]">
        {/* 1. TEAMS TAB */}
        {activeTab === "teams" && (
          <div className="space-y-3">
            {displayedTeams.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No Teams match the selected dropdown filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedTeams.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/80">
                        {t.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEditModal(t)} className="p-1 text-slate-400 hover:text-slate-800 transition"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => handleDelete("TEAM", t.id, t.name)} className="p-1 text-slate-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{t.name}</h4>
                      {t.department && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                          <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>Department: <strong className="text-slate-800 font-semibold">{t.department.name}</strong></span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Team Leader:</strong> {t.teamLeader ? t.teamLeader.name : "Unassigned"}</span>
                      </p>
                      {t.department?.branch && (
                        <p className="text-slate-500 text-[11px] flex items-center gap-1 pt-0.5">
                          <Layers className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Path: {t.department.branch.name} → {t.department.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. DEPARTMENTS TAB */}
        {activeTab === "depts" && (
          <div className="space-y-3">
            {displayedDepts.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No Departments match the selected dropdown filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedDepts.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                        {d.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEditModal(d)} className="p-1 text-slate-400 hover:text-slate-800 transition"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => handleDelete("DEPARTMENT", d.id, d.name)} className="p-1 text-slate-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{d.name}</h4>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Branch:</strong> {d.branch ? d.branch.name : "Global Dept"}</span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Department Head:</strong> {d.departmentHead ? d.departmentHead.name : "Unassigned"}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. BRANCHES TAB */}
        {activeTab === "branches" && (
          <div className="space-y-3">
            {displayedBranches.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No Branches match the selected dropdown filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedBranches.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-300 hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80">
                        {b.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEditModal(b)} className="p-1 text-slate-400 hover:text-slate-800 transition"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => handleDelete("BRANCH", b.id, b.name)} className="p-1 text-slate-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                      {b.city && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium"><MapPin className="h-3.5 w-3.5 text-teal-500 shrink-0" /> {b.city}</p>}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Franchise:</strong> {b.franchise ? b.franchise.name : "Direct Branch"}</span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Branch Manager:</strong> {b.branchManager ? b.branchManager.name : "Unassigned"}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. FRANCHISES TAB */}
        {activeTab === "franchises" && (
          <div className="space-y-3">
            {displayedFranchises.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No Franchises match the selected dropdown filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedFranchises.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                        {f.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEditModal(f)} className="p-1 text-slate-400 hover:text-slate-800 transition"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => handleDelete("FRANCHISE", f.id, f.name)} className="p-1 text-slate-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{f.name}</h4>
                      {f.location && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium"><MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {f.location}</p>}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Organization:</strong> {f.organization ? f.organization.name : "BrickVest Global White Label"}</span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Franchise Admin:</strong> {f.franchiseAdmin ? f.franchiseAdmin.name : "Unassigned"}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. WHITE LABELS TAB */}
        {activeTab === "orgs" && (
          <div className="space-y-3">
            {displayedOrgs.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">No White Label Organizations match the selected dropdown filter.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedOrgs.map((o) => (
                  <div key={o.id} className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                        {o.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEditModal(o)} className="p-1 text-slate-400 hover:text-slate-800 transition"><Edit3 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => handleDelete("ORGANIZATION", o.id, o.name)} className="p-1 text-slate-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{o.name}</h4>
                      {o.domain && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium"><Globe className="h-3.5 w-3.5 text-purple-500 shrink-0" /> {o.domain}</p>}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span><strong className="text-slate-800 font-semibold">Admin:</strong> {o.whiteLabelAdmin ? o.whiteLabelAdmin.name : "Unassigned"}</span>
                      </p>
                      <p className="text-slate-500 text-[11px]">{o._count?.franchises ?? 0} Franchises · {o._count?.users ?? 0} Users</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. ROLE MATRIX & SUPERSETS TAB */}
        {activeTab === "matrix" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Complete Enterprise Role & Superset Matrix</h3>
                <p className="text-xs text-slate-500">
                  Full blueprint defining supersets, subsets, user management scopes, CRM capabilities, settings, billing, and data scopes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] font-extrabold uppercase text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 border-r border-slate-200">Role</th>
                    <th className="p-3 border-r border-slate-200">Hierarchy Level</th>
                    <th className="p-3 border-r border-slate-200">Users Mgmt</th>
                    <th className="p-3 border-r border-slate-200">Roles Scope</th>
                    <th className="p-3 border-r border-slate-200">CRM Scope</th>
                    <th className="p-3 border-r border-slate-200">Reports Scope</th>
                    <th className="p-3 border-r border-slate-200">Settings</th>
                    <th className="p-3 border-r border-slate-200">Billing</th>
                    <th className="p-3 border-r border-slate-200">Marketplace</th>
                    <th className="p-3 border-r border-slate-200">Demo</th>
                    <th className="p-3">Data Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {ROLE_MATRIX_DATA.map((row) => (
                    <tr key={row.roleKey} className="hover:bg-slate-50">
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                        {row.role}
                      </td>
                      <td className="p-3 border-r border-slate-200 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-extrabold text-[10px] uppercase border border-amber-300">
                          {row.hierarchy}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-200">{row.usersMgmt}</td>
                      <td className="p-3 border-r border-slate-200">{row.roles}</td>
                      <td className="p-3 border-r border-slate-200">{row.crm}</td>
                      <td className="p-3 border-r border-slate-200">{row.reports}</td>
                      <td className="p-3 border-r border-slate-200">{row.settings}</td>
                      <td className="p-3 border-r border-slate-200">{row.settings}</td>
                      <td className="p-3 border-r border-slate-200">{row.marketplace}</td>
                      <td className="p-3 border-r border-slate-200">
                        {row.demo === "Yes" ? <span className="text-red-600 font-bold">Yes</span> : "No"}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{row.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Folder Structure Modal */}
      {isTreeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Complete Organization Folder Structure</h3>
                  <p className="text-xs text-slate-500">Nested folder hierarchy: White Label ➔ Franchise ➔ Branch ➔ Department ➔ Team</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllNodes}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllNodes}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                >
                  Collapse All
                </button>
                <button
                  type="button"
                  onClick={() => setIsTreeModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-base px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Folder Tree Filter Search Bar */}
            <div className="shrink-0">
              <input
                type="text"
                placeholder="Search folders or sub-folders..."
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 p-2.5 outline-none focus:border-amber-400 focus:bg-white transition"
              />
            </div>

            {/* Folder Hierarchy Tree List */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              {/* 1. White Label Organizations Folders */}
              {orgs.map((o) => {
                const isOrgExpanded = Boolean(expandedNodes[o.id]);
                const orgFranchises = franchises.filter((f) => f.organizationId === o.id);

                if (treeSearchQuery && !o.name.toLowerCase().includes(treeSearchQuery.toLowerCase()) && !orgFranchises.some((f) => f.name.toLowerCase().includes(treeSearchQuery.toLowerCase()))) {
                  return null;
                }

                return (
                  <div key={o.id} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    {/* Organization / White Label Folder */}
                    <div
                      onClick={() => toggleNode(o.id)}
                      className="flex items-center justify-between cursor-pointer hover:bg-purple-50/60 p-2 rounded-lg transition"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOrgExpanded ? <ChevronDown className="h-4 w-4 text-purple-600 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                        {isOrgExpanded ? <FolderOpen className="h-4.5 w-4.5 text-purple-600 shrink-0" /> : <Folder className="h-4.5 w-4.5 text-purple-600 shrink-0" />}
                        <span className="font-extrabold text-slate-900 text-sm">{o.name}</span>
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{o.code}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300">
                          White Label Tenant
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-purple-600" />
                          <span>Admin: {o.whiteLabelAdmin ? o.whiteLabelAdmin.name : "Unassigned"}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">{orgFranchises.length} Franchises</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsTreeModalOpen(false); openEditModal(o); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {/* Franchises Sub-Folders */}
                    {isOrgExpanded && (
                      <div className="ml-6 border-l-2 border-purple-100 pl-3 space-y-1.5 pt-1">
                        {orgFranchises.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-1">No Franchise sub-folders in this White Label.</p>
                        ) : (
                          orgFranchises.map((f) => {
                            const isFranchiseExpanded = Boolean(expandedNodes[f.id]);
                            const franchiseBranches = branches.filter((b) => b.franchiseId === f.id);

                            return (
                              <div key={f.id} className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                                {/* Franchise Folder */}
                                <div
                                  onClick={() => toggleNode(f.id)}
                                  className="flex items-center justify-between cursor-pointer hover:bg-emerald-50/60 p-1.5 rounded-md transition"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isFranchiseExpanded ? <ChevronDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                    {isFranchiseExpanded ? <FolderOpen className="h-4 w-4 text-emerald-600 shrink-0" /> : <Folder className="h-4 w-4 text-emerald-600 shrink-0" />}
                                    <span className="font-bold text-slate-900 text-xs">{f.name}</span>
                                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{f.code}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Franchise
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                      <UserCheck className="h-3 w-3 text-emerald-600" />
                                      <span>Franchise Admin: {f.franchiseAdmin ? f.franchiseAdmin.name : "Unassigned"}</span>
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500">{franchiseBranches.length} Branches</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsTreeModalOpen(false); openEditModal(f); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                                  </div>
                                </div>

                                {/* Branches Sub-Folders */}
                                {isFranchiseExpanded && (
                                  <div className="ml-5 border-l-2 border-emerald-100 pl-3 space-y-1.5 pt-1">
                                    {franchiseBranches.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic py-1">No Branch sub-folders.</p>
                                    ) : (
                                      franchiseBranches.map((b) => {
                                        const isBranchExpanded = Boolean(expandedNodes[b.id]);
                                        const branchDepts = depts.filter((d) => d.branchId === b.id);

                                        return (
                                          <div key={b.id} className="space-y-1.5 bg-white p-2 rounded-md border border-slate-200">
                                            {/* Branch Folder */}
                                            <div
                                              onClick={() => toggleNode(b.id)}
                                              className="flex items-center justify-between cursor-pointer hover:bg-teal-50/60 p-1 rounded-sm transition"
                                            >
                                              <div className="flex items-center gap-2 flex-wrap">
                                                {isBranchExpanded ? <ChevronDown className="h-3.5 w-3.5 text-teal-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                                {isBranchExpanded ? <FolderOpen className="h-3.5 w-3.5 text-teal-600 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                                                <span className="font-bold text-slate-900 text-xs">{b.name}</span>
                                                <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{b.code}</span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-teal-100 text-teal-800 border border-teal-300">
                                                  City Branch
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                                                  <UserCheck className="h-3 w-3 text-teal-600" />
                                                  <span>Branch Mgr: {b.branchManager ? b.branchManager.name : "Unassigned"}</span>
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500">{branchDepts.length} Depts</span>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsTreeModalOpen(false); openEditModal(b); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3 w-3" /></button>
                                              </div>
                                            </div>

                                            {/* Departments Sub-Folders */}
                                            {isBranchExpanded && (
                                              <div className="ml-4 border-l-2 border-teal-100 pl-3 space-y-1 pt-1">
                                                {branchDepts.length === 0 ? (
                                                  <p className="text-[11px] text-slate-400 italic py-0.5">No Department sub-folders.</p>
                                                ) : (
                                                  branchDepts.map((d) => {
                                                    const isDeptExpanded = Boolean(expandedNodes[d.id]);
                                                    const deptTeams = teams.filter((t) => t.departmentId === d.id);

                                                    return (
                                                      <div key={d.id} className="space-y-1 bg-white p-1.5 rounded border border-slate-200">
                                                        {/* Department Folder */}
                                                        <div
                                                          onClick={() => toggleNode(d.id)}
                                                          className="flex items-center justify-between cursor-pointer hover:bg-blue-50/60 p-1 rounded-xs transition"
                                                        >
                                                          <div className="flex items-center gap-2 flex-wrap">
                                                            {isDeptExpanded ? <ChevronDown className="h-3 w-3 text-blue-600 shrink-0" /> : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                                                            {isDeptExpanded ? <FolderOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                                                            <span className="font-bold text-slate-900 text-[11px]">{d.name}</span>
                                                            <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">{d.code}</span>
                                                            <span className="px-1 py-0.2 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-300">
                                                              Department
                                                            </span>
                                                          </div>
                                                          <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                                              <UserCheck className="h-3 w-3 text-blue-600" />
                                                              <span>Dept Head: {d.departmentHead ? d.departmentHead.name : "Unassigned"}</span>
                                                            </span>
                                                            <span className="text-[10px] font-semibold text-slate-500">{deptTeams.length} Teams</span>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setIsTreeModalOpen(false); openEditModal(d); }} className="p-0.5 text-slate-400 hover:text-slate-800"><Edit3 className="h-3 w-3" /></button>
                                                          </div>
                                                        </div>

                                                        {/* Teams Leaf Sub-Folders */}
                                                        {isDeptExpanded && (
                                                          <div className="ml-4 border-l-2 border-blue-100 pl-2.5 space-y-1 pt-0.5">
                                                            {deptTeams.length === 0 ? (
                                                              <p className="text-[10px] text-slate-400 italic">No Team leaf sub-folders.</p>
                                                            ) : (
                                                              deptTeams.map((t) => (
                                                                <div key={t.id} className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200 text-[11px]">
                                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <Users className="h-3 w-3 text-indigo-600 shrink-0" />
                                                                    <span className="font-bold text-slate-800">{t.name}</span>
                                                                    <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">{t.code}</span>
                                                                    <span className="px-1 py-0.2 rounded text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">
                                                                      Team
                                                                    </span>
                                                                  </div>
                                                                  <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                                                      <UserCheck className="h-3 w-3 text-indigo-600" />
                                                                      <span>Team Leader: {t.teamLeader ? t.teamLeader.name : "Unassigned"}</span>
                                                                    </span>
                                                                    <button type="button" onClick={() => { setIsTreeModalOpen(false); openEditModal(t); }} className="p-0.5 text-slate-400 hover:text-slate-800"><Edit3 className="h-3 w-3" /></button>
                                                                  </div>
                                                                </div>
                                                              ))
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 2. Independent / Unassigned Franchises (No White Label Parent) */}
              {franchises.filter((f) => !f.organizationId || !orgs.some((o) => o.id === f.organizationId)).map((f) => (
                <div key={f.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs">{f.name}</span>
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{f.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Franchise (Independent)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-emerald-600" />
                        <span>Franchise Admin: {f.franchiseAdmin ? f.franchiseAdmin.name : "Unassigned"}</span>
                      </span>
                      <button type="button" onClick={() => { setIsTreeModalOpen(false); openEditModal(f); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 3. Direct / Unassigned City Branches (No Franchise Parent) */}
              {branches.filter((b) => !b.franchiseId || !franchises.some((f) => f.id === b.franchiseId)).map((b) => (
                <div key={b.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs">{b.name}</span>
                      <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{b.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-teal-100 text-teal-800 border border-teal-300">City Branch (Direct)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-teal-600" />
                        <span>Branch Mgr: {b.branchManager ? b.branchManager.name : "Unassigned"}</span>
                      </span>
                      <button type="button" onClick={() => { setIsTreeModalOpen(false); openEditModal(b); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 4. Global / Unassigned Departments (No Branch Parent) */}
              {depts.filter((d) => !d.branchId || !branches.some((b) => b.id === d.branchId)).map((d) => (
                <div key={d.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs">{d.name}</span>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{d.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-300">Department (Global)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-blue-600" />
                        <span>Dept Head: {d.departmentHead ? d.departmentHead.name : "Unassigned"}</span>
                      </span>
                      <button type="button" onClick={() => { setIsTreeModalOpen(false); openEditModal(d); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 5. Direct / Unassigned Teams (No Department Parent) */}
              {teams.filter((t) => !t.departmentId || !depts.some((d) => d.id === t.departmentId)).map((t) => (
                <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                      <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{t.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">Team (General)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-indigo-600" />
                        <span>Team Leader: {t.teamLeader ? t.teamLeader.name : "Unassigned"}</span>
                      </span>
                      <button type="button" onClick={() => { setIsTreeModalOpen(false); openEditModal(t); }} className="p-1 text-slate-400 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plain White Footer Button */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsTreeModalOpen(false)}
                className="rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Close Folder View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-20">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? "Edit" : "Add New"} {tabSingularLabel}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {error && <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

            {/* Live Hierarchy Path Chain */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Hierarchy Chain:</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {orgs.find((o) => o.id === formOrgId)?.name || "Global Tenant"}
              </span>
              {activeTab !== "orgs" && (
                <>
                  <span>➔</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {franchises.find((f) => f.id === formFranchiseId)?.name || "Independent Franchise"}
                  </span>
                </>
              )}
              {(activeTab === "branches" || activeTab === "depts" || activeTab === "teams") && (
                <>
                  <span>➔</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {branches.find((b) => b.id === formBranchId)?.name || "Direct Branch"}
                  </span>
                </>
              )}
              {(activeTab === "depts" || activeTab === "teams") && (
                <>
                  <span>➔</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {depts.find((d) => d.id === formDeptId)?.name || "General Department"}
                  </span>
                </>
              )}
              {activeTab === "teams" && (
                <>
                  <span>➔</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {formName || "New Team"}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-3">
              {/* Parent 1: Organization / Tenant */}
              {activeTab !== "orgs" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">ORGANIZATION / TENANT</label>
                  <SearchableSelect
                    options={[{ value: "", label: "Independent Organization" }, ...orgs.map((o) => ({ value: o.id, label: o.name }))]}
                    value={formOrgId}
                    onChange={(val) => handleOrgChange(val)}
                  />
                </div>
              )}

              {/* Parent 2: Franchise (strictly filtered by selected Organization) */}
              {(activeTab === "branches" || activeTab === "depts" || activeTab === "teams") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">FRANCHISE</label>
                  <SearchableSelect
                    options={franchiseOptions}
                    value={formFranchiseId}
                    onChange={(val) => handleFranchiseChange(val)}
                  />
                </div>
              )}

              {/* Parent 3: Branch (strictly filtered by selected Franchise and Organization) */}
              {(activeTab === "depts" || activeTab === "teams") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">BRANCH</label>
                  <SearchableSelect
                    options={branchOptions}
                    value={formBranchId}
                    onChange={(val) => handleBranchChange(val)}
                  />
                </div>
              )}

              {/* Parent 4: Department (strictly filtered by selected Branch, Franchise, Organization) */}
              {activeTab === "teams" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">DEPARTMENT</label>
                  <SearchableSelect
                    options={deptOptions}
                    value={formDeptId}
                    onChange={(val) => handleDeptChange(val)}
                  />
                </div>
              )}

              {/* Unit Basic Details */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">NAME</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alpha Sales Team, Delhi Central Branch"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">UNIQUE CODE</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. TEAM-ALPHA, BR-DEL"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              {activeTab === "orgs" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">DOMAIN NAME (OPTIONAL)</label>
                  <input
                    type="text"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    placeholder="e.g. white-label-brand.com"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {activeTab === "franchises" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">LOCATION / TERRITORY</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. North India Region"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {activeTab === "branches" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">CITY</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. New Delhi, Mumbai"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {/* Filtered Leader Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">ASSIGNED LEADER / HEAD</label>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllUsersOverride}
                      onChange={(e) => setShowAllUsersOverride(e.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Show all roles ({allUsers.length})</span>
                  </label>
                </div>
                <SearchableSelect
                  options={userOptions}
                  value={formLeaderId}
                  onChange={(val) => setFormLeaderId(val)}
                  placeholder="Unassigned (Select Relevant Leader)"
                  searchPlaceholder="Search relevant user..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 font-sans cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 border border-amber-300 cursor-pointer font-sans"
              >
                {busy ? "Saving..." : "Save Unit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
