CREATE SCHEMA IF NOT EXISTS "basalt_ui_playground";
--> statement-breakpoint
CREATE TABLE "basalt_ui_playground"."user_preferences" (
	"user_id" text PRIMARY KEY,
	"theme" text DEFAULT 'system' NOT NULL,
	"view_mode" text DEFAULT 'grid' NOT NULL,
	"sort_by" text DEFAULT 'default' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basalt_ui_playground"."account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basalt_ui_playground"."session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basalt_ui_playground"."user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basalt_ui_playground"."verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "basalt_ui_playground"."account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "basalt_ui_playground"."session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "basalt_ui_playground"."verification" ("identifier");--> statement-breakpoint
ALTER TABLE "basalt_ui_playground"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "basalt_ui_playground"."user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "basalt_ui_playground"."account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "basalt_ui_playground"."user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "basalt_ui_playground"."session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "basalt_ui_playground"."user"("id") ON DELETE CASCADE;