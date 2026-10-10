CREATE TYPE "public"."alert_status" AS ENUM('new', 'in_progress', 'true_positive', 'false_positive', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"agent_name" text NOT NULL,
	"agent_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"rule_level" integer NOT NULL,
	"rule_description" text NOT NULL,
	"severity" "severity" NOT NULL,
	"rule_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mitre_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mitre_tactics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mitre_techniques" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"process_name" text,
	"parent_process" text,
	"command_line" text,
	"target_image" text,
	"user_name" text,
	"raw_log" jsonb NOT NULL,
	"status" "alert_status" DEFAULT 'new' NOT NULL,
	"analyst_notes" text,
	"case_id" uuid,
	"is_sample" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alerts_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"status" "case_status" DEFAULT 'open' NOT NULL,
	"verdict" text,
	"response_steps" text,
	"lessons_learned" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_timestamp_idx" ON "alerts" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "alerts_severity_idx" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alerts_status_idx" ON "alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alerts_case_idx" ON "alerts" USING btree ("case_id");