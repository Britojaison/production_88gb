/**
 * Supabase types for the 88GB Production Expenses tables (public.*_slate).
 * Trimmed from `supabase gen types` — the project also hosts other apps' tables.
 * Regenerate after schema changes (Supabase dashboard → API docs, or the CLI).
 */
type Rel<FK extends string, Cols extends string[], Ref extends string> = {
  foreignKeyName: FK;
  columns: Cols;
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      audit_events_slate: {
        Row: {
          action: string;
          actorId: string | null;
          createdAt: string;
          expenseId: string;
          fromStatus: string | null;
          id: string;
          note: string | null;
          toStatus: string | null;
        };
        Insert: {
          action: string;
          actorId?: string | null;
          createdAt?: string;
          expenseId: string;
          fromStatus?: string | null;
          id?: string;
          note?: string | null;
          toStatus?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_events_slate"]["Insert"]>;
        Relationships: [
          Rel<"audit_events_slate_actorId_fkey", ["actorId"], "users_slate">,
          Rel<"audit_events_slate_expenseId_fkey", ["expenseId"], "expenses_slate">,
        ];
      };
      brands_slate: {
        Row: { createdAt: string; id: string; logoPath: string | null; name: string; updatedAt: string };
        Insert: { createdAt?: string; id?: string; logoPath?: string | null; name: string; updatedAt?: string };
        Update: { createdAt?: string; id?: string; logoPath?: string | null; name?: string; updatedAt?: string };
        Relationships: [];
      };
      categories_slate: {
        Row: { createdAt: string; id: string; name: string; slug: string; sortOrder: number };
        Insert: { createdAt?: string; id?: string; name: string; slug: string; sortOrder?: number };
        Update: { createdAt?: string; id?: string; name?: string; slug?: string; sortOrder?: number };
        Relationships: [];
      };
      expenses_slate: {
        Row: {
          advancePaid: number | null;
          amount: number;
          categoryId: string | null;
          createdAt: string;
          date: string;
          dueDate: string | null;
          id: string;
          invoiceUrl: string | null;
          paid: boolean;
          paidAt: string | null;
          paidTo: string;
          priority: string | null;
          receiptName: string | null;
          receiptPath: string | null;
          rejectionReason: string | null;
          remarks: string | null;
          reviewedAt: string | null;
          reviewedById: string | null;
          shootId: string;
          status: string;
          submittedAt: string | null;
          submitterId: string;
          title: string;
          updatedAt: string;
          vendorId: string | null;
          vendorPaymentDetails: string;
        };
        Insert: {
          advancePaid?: number | null;
          amount: number;
          categoryId?: string | null;
          createdAt?: string;
          date: string;
          dueDate?: string | null;
          id?: string;
          invoiceUrl?: string | null;
          paid?: boolean;
          paidAt?: string | null;
          paidTo: string;
          priority?: string | null;
          receiptName?: string | null;
          receiptPath?: string | null;
          rejectionReason?: string | null;
          remarks?: string | null;
          reviewedAt?: string | null;
          reviewedById?: string | null;
          shootId: string;
          status?: string;
          submittedAt?: string | null;
          submitterId: string;
          title: string;
          updatedAt?: string;
          vendorId?: string | null;
          vendorPaymentDetails: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses_slate"]["Insert"]>;
        Relationships: [
          Rel<"expenses_slate_categoryId_fkey", ["categoryId"], "categories_slate">,
          Rel<"expenses_slate_reviewedById_fkey", ["reviewedById"], "users_slate">,
          Rel<"expenses_slate_shootId_fkey", ["shootId"], "shoots_slate">,
          Rel<"expenses_slate_submitterId_fkey", ["submitterId"], "users_slate">,
          Rel<"expenses_slate_vendorId_fkey", ["vendorId"], "vendors_slate">,
        ];
      };
      notifications_slate: {
        Row: {
          body: string;
          createdAt: string;
          expenseId: string | null;
          href: string | null;
          id: string;
          read: boolean;
          title: string;
          type: string;
          userId: string;
        };
        Insert: {
          body: string;
          createdAt?: string;
          expenseId?: string | null;
          href?: string | null;
          id?: string;
          read?: boolean;
          title: string;
          type: string;
          userId: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications_slate"]["Insert"]>;
        Relationships: [
          Rel<"notifications_slate_expenseId_fkey", ["expenseId"], "expenses_slate">,
          Rel<"notifications_slate_userId_fkey", ["userId"], "users_slate">,
        ];
      };
      shoot_brands_slate: {
        Row: { brandId: string; shootId: string };
        Insert: { brandId: string; shootId: string };
        Update: { brandId?: string; shootId?: string };
        Relationships: [
          Rel<"shoot_brands_slate_brandId_fkey", ["brandId"], "brands_slate">,
          Rel<"shoot_brands_slate_shootId_fkey", ["shootId"], "shoots_slate">,
        ];
      };
      shoots_slate: {
        Row: {
          budget: number | null;
          createdAt: string;
          endDate: string | null;
          id: string;
          image: string | null;
          name: string;
          notes: string | null;
          startDate: string;
          status: string;
          updatedAt: string;
        };
        Insert: {
          budget?: number | null;
          createdAt?: string;
          endDate?: string | null;
          id?: string;
          image?: string | null;
          name: string;
          notes?: string | null;
          startDate: string;
          status?: string;
          updatedAt?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shoots_slate"]["Insert"]>;
        Relationships: [];
      };
      users_slate: {
        Row: {
          createdAt: string;
          email: string;
          id: string;
          name: string;
          passwordHash: string;
          role: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          email: string;
          id?: string;
          name: string;
          passwordHash: string;
          role: string;
          updatedAt?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users_slate"]["Insert"]>;
        Relationships: [];
      };
      vendors_slate: {
        Row: { createdAt: string; id: string; name: string; paymentDetails: string; updatedAt: string };
        Insert: { createdAt?: string; id?: string; name: string; paymentDetails: string; updatedAt?: string };
        Update: { createdAt?: string; id?: string; name?: string; paymentDetails?: string; updatedAt?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type T = Database["public"]["Tables"];
export type Row<K extends keyof T> = T[K]["Row"];
export type Insert<K extends keyof T> = T[K]["Insert"];
export type Update<K extends keyof T> = T[K]["Update"];
