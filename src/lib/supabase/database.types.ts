export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      analysis_results: {
        Row: {
          ai_correctness_addressed: boolean;
          ai_correctness_evidence: string;
          analysis_version: string;
          changes_addressed: boolean;
          changes_evidence: string;
          created_at: string;
          explanation: string;
          final_version_id: string;
          id: string;
          iteration_id: string;
          model: string;
          project_id: string;
          rubric_version: string;
          uncertainty: string;
          verification_addressed: boolean;
          verification_evidence: string;
        };
        ComputedFields: never;
        Insert: {
          ai_correctness_addressed: boolean;
          ai_correctness_evidence: string;
          analysis_version: string;
          changes_addressed: boolean;
          changes_evidence: string;
          created_at?: string;
          explanation: string;
          final_version_id: string;
          id?: string;
          iteration_id: string;
          model: string;
          project_id: string;
          rubric_version: string;
          uncertainty: string;
          verification_addressed: boolean;
          verification_evidence: string;
        };
        Update: {
          ai_correctness_addressed?: boolean;
          ai_correctness_evidence?: string;
          analysis_version?: string;
          changes_addressed?: boolean;
          changes_evidence?: string;
          created_at?: string;
          explanation?: string;
          final_version_id?: string;
          id?: string;
          iteration_id?: string;
          model?: string;
          project_id?: string;
          rubric_version?: string;
          uncertainty?: string;
          verification_addressed?: boolean;
          verification_evidence?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_results_final_version_id_project_id_fkey";
            columns: ["final_version_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "final_versions";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "analysis_results_iteration_id_project_id_fkey";
            columns: ["iteration_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "iterations";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "analysis_results_project_id_projects_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      assignments: {
        Row: {
          brief: string;
          course_id: string;
          created_at: string;
          due_at: string | null;
          id: string;
          lane: Database["public"]["Enums"]["assignment_lane"];
          title: string;
        };
        ComputedFields: never;
        Insert: {
          brief?: string;
          course_id: string;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          lane: Database["public"]["Enums"]["assignment_lane"];
          title: string;
        };
        Update: {
          brief?: string;
          course_id?: string;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          lane?: Database["public"]["Enums"]["assignment_lane"];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_courses_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          instructor_id: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          instructor_id: string;
          title: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          instructor_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_profiles_id_fk";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enrolments: {
        Row: {
          course_id: string;
          created_at: string;
          email: string;
          id: string;
          student_id: string | null;
          has_work: boolean | null;
        };
        ComputedFields: "has_work";
        Insert: {
          course_id: string;
          created_at?: string;
          email: string;
          id?: string;
          student_id?: string | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrolments_course_id_courses_id_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrolments_student_id_profiles_id_fk";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      final_versions: {
        Row: {
          created_at: string;
          extracted_text: string;
          id: string;
          is_current: boolean;
          match_results: Json | null;
          matching_version: string | null;
          original_filename: string | null;
          project_id: string;
          submitted_at: string | null;
          version_number: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          extracted_text?: string;
          id?: string;
          is_current?: boolean;
          match_results?: Json | null;
          matching_version?: string | null;
          original_filename?: string | null;
          project_id: string;
          submitted_at?: string | null;
          version_number: number;
        };
        Update: {
          created_at?: string;
          extracted_text?: string;
          id?: string;
          is_current?: boolean;
          match_results?: Json | null;
          matching_version?: string | null;
          original_filename?: string | null;
          project_id?: string;
          submitted_at?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "final_versions_project_id_projects_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      flag_reviews: {
        Row: {
          flag_id: string;
          id: string;
          review_state: Database["public"]["Enums"]["flag_review_state"];
          reviewed_at: string;
          reviewer_id: string;
        };
        ComputedFields: never;
        Insert: {
          flag_id: string;
          id?: string;
          review_state: Database["public"]["Enums"]["flag_review_state"];
          reviewed_at?: string;
          reviewer_id: string;
        };
        Update: {
          flag_id?: string;
          id?: string;
          review_state?: Database["public"]["Enums"]["flag_review_state"];
          reviewed_at?: string;
          reviewer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flag_reviews_flag_id_flags_id_fk";
            columns: ["flag_id"];
            isOneToOne: false;
            referencedRelation: "flags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flag_reviews_reviewer_id_profiles_id_fk";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      flags: {
        Row: {
          analysis_result_id: string;
          created_at: string;
          evidence: string;
          explanation: string;
          id: string;
          kind: string;
          review_state: Database["public"]["Enums"]["flag_review_state"];
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          analysis_result_id: string;
          created_at?: string;
          evidence: string;
          explanation: string;
          id?: string;
          kind: string;
          review_state?: Database["public"]["Enums"]["flag_review_state"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          analysis_result_id?: string;
          created_at?: string;
          evidence?: string;
          explanation?: string;
          id?: string;
          kind?: string;
          review_state?: Database["public"]["Enums"]["flag_review_state"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "flags_analysis_result_id_analysis_results_id_fk";
            columns: ["analysis_result_id"];
            isOneToOne: false;
            referencedRelation: "analysis_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flags_reviewed_by_profiles_id_fk";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      grader_notes: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          final_version_id: string | null;
          id: string;
          iteration_id: string | null;
          project_id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          final_version_id?: string | null;
          id?: string;
          iteration_id?: string | null;
          project_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          final_version_id?: string | null;
          id?: string;
          iteration_id?: string | null;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grader_notes_author_id_profiles_id_fk";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grader_notes_final_version_id_project_id_fkey";
            columns: ["final_version_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "final_versions";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "grader_notes_iteration_id_project_id_fkey";
            columns: ["iteration_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "iterations";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "grader_notes_project_id_projects_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      iterations: {
        Row: {
          ai_error_evidence: string | null;
          ai_tool: string;
          created_at: string;
          critique: string | null;
          id: string;
          import_source: Database["public"]["Enums"]["import_source"];
          imported_at: string | null;
          marks: NonNullable<Json>;
          project_id: string;
          prompt: string;
          raw_answer: string;
          source_conversation_id: string | null;
          source_step_id: string | null;
          source_url: string | null;
          step_number: number;
          student_marked_ai_error: boolean;
        };
        ComputedFields: never;
        Insert: {
          ai_error_evidence?: string | null;
          ai_tool: string;
          created_at?: string;
          critique?: string | null;
          id?: string;
          import_source?: Database["public"]["Enums"]["import_source"];
          imported_at?: string | null;
          marks?: NonNullable<Json>;
          project_id: string;
          prompt: string;
          raw_answer: string;
          source_conversation_id?: string | null;
          source_step_id?: string | null;
          source_url?: string | null;
          step_number: number;
          student_marked_ai_error?: boolean;
        };
        Update: {
          ai_error_evidence?: string | null;
          ai_tool?: string;
          created_at?: string;
          critique?: string | null;
          id?: string;
          import_source?: Database["public"]["Enums"]["import_source"];
          imported_at?: string | null;
          marks?: NonNullable<Json>;
          project_id?: string;
          prompt?: string;
          raw_answer?: string;
          source_conversation_id?: string | null;
          source_step_id?: string | null;
          source_url?: string | null;
          step_number?: number;
          student_marked_ai_error?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "iterations_project_id_projects_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          role: Database["public"]["Enums"]["profile_role"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          role?: Database["public"]["Enums"]["profile_role"];
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["profile_role"];
        };
        Relationships: [];
      };
      projects: {
        Row: {
          analysis_error: string | null;
          analysis_finished_at: string | null;
          analysis_started_at: string | null;
          analysis_status: Database["public"]["Enums"]["analysis_status"];
          analysis_version: string | null;
          assignment_id: string;
          course_id: string;
          created_at: string;
          id: string;
          status: Database["public"]["Enums"]["project_status"];
          student_id: string;
          submitted_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          analysis_error?: string | null;
          analysis_finished_at?: string | null;
          analysis_started_at?: string | null;
          analysis_status?: Database["public"]["Enums"]["analysis_status"];
          analysis_version?: string | null;
          assignment_id: string;
          course_id: string;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["project_status"];
          student_id: string;
          submitted_at?: string | null;
        };
        Update: {
          analysis_error?: string | null;
          analysis_finished_at?: string | null;
          analysis_started_at?: string | null;
          analysis_status?: Database["public"]["Enums"]["analysis_status"];
          analysis_version?: string | null;
          assignment_id?: string;
          course_id?: string;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["project_status"];
          student_id?: string;
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_assignment_id_course_id_fkey";
            columns: ["assignment_id", "course_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id", "course_id"];
          },
          {
            foreignKeyName: "projects_course_id_student_id_fkey";
            columns: ["course_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "enrolments";
            referencedColumns: ["course_id", "student_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_steps: {
        Args: { project: string; steps: Json };
        Returns: {
          id: string;
          step_number: number;
        }[];
      };
      enrol_students: {
        Args: { course: string; emails: string[] };
        Returns: {
          address: string;
          outcome: string;
        }[];
      };
      has_work: {
        Args: {
          enrolment: Omit<
            Database["public"]["Tables"]["enrolments"]["Row"],
            Database["public"]["Tables"]["enrolments"]["ComputedFields"]
          >;
        };
        Returns: boolean;
      };
      remove_step: {
        Args: { project: string; step: string };
        Returns: undefined;
      };
      save_final_version: {
        Args: {
          base: number;
          body: string;
          filename?: string;
          project: string;
        };
        Returns: {
          created_at: string;
          id: string;
          version_number: number;
        }[];
      };
      submit_project: { Args: { project: string }; Returns: string };
    };
    Enums: {
      analysis_status: "pending" | "running" | "completed" | "failed";
      assignment_lane: "lane_1" | "lane_2";
      flag_review_state: "open" | "dismissed" | "added_to_feedback";
      import_source: "manual" | "public_link" | "pasted_text";
      profile_role: "student" | "instructor";
      project_status: "draft" | "submitted";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      analysis_status: ["pending", "running", "completed", "failed"],
      assignment_lane: ["lane_1", "lane_2"],
      flag_review_state: ["open", "dismissed", "added_to_feedback"],
      import_source: ["manual", "public_link", "pasted_text"],
      profile_role: ["student", "instructor"],
      project_status: ["draft", "submitted"],
    },
  },
} as const;
