export type CompanyStatus = "changed" | "ok" | "error" | "pending";
export type WorkMode = "office" | "remote" | "hybrid" | "unknown";
export type CandidateDecision = "pending" | "approved" | "rejected";

export type ApplicationStatus =
  | "bookmarked"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected";

export type InterestLevel = "high" | "medium" | "low" | "none";

export interface Company {
  id: number;
  name: string;
  url: string;
  source: string;
  city: string;
  work_mode: WorkMode;
  notes: string;
  created_at: string;
  last_checked_at: string | null;
  status: CompanyStatus;
  interest_level: InterestLevel;
}

export interface Application {
  id: number;
  company_id: number | null;
  position_name: string;
  job_url: string;
  job_description: string;
  status: ApplicationStatus;
  work_mode: WorkMode;
  salary: string;
  deadline: string;
  contact: string;
  fit_analysis: string;
  applied_at: string | null;
  notes: string;
  created_at: string;
}

export interface CV {
  id: number;
  application_id: number | null;
  is_base: number; // 0 or 1
  label: string;
  content: string;
  created_at: string;
}

export interface Snapshot {
  id: number;
  company_id: number;
  checked_at: string;
  content_hash: string;
  content_text: string;
  status: "ok" | "error";
  error_message: string | null;
}

export interface Candidate {
  id: number;
  name: string;
  url: string;
  source: string;
  found_at: string;
  decision: CandidateDecision;
}

/** A company found by a harvester or discovery, before it is stored. */
export interface FoundCompany {
  name: string;
  url: string;
  source: string;
  city?: string;
  work_mode?: WorkMode;
  notes?: string;
}
