export type ResourceMode = "read" | "read-update" | "crud";

export type AdminResourceFieldInput = "text" | "textarea" | "number";

export type AdminResourceUiConfig = {
  createFields?: string[];
  editFields?: string[];
  modalCreate?: boolean;
  modalEdit?: boolean;
  inlineEdit?: boolean;
  fieldInputs?: Record<string, AdminResourceFieldInput>;
};

export type AdminResourceConfig = {
  slug: string;
  table: string;
  title: string;
  subtitle: string;
  mode: ResourceMode;
  settingsLike?: boolean;
  ui?: AdminResourceUiConfig;
};

export const ADMIN_RESOURCE_CONFIGS: Record<string, AdminResourceConfig> = {
  "humor-themes": {
    slug: "humor-themes",
    table: "humor_themes",
    title: "Humor Themes",
    subtitle: "Read-only overview of configured humor themes.",
    mode: "read",
  },
  "humor-flavors": {
    slug: "humor-flavors",
    table: "humor_flavors",
    title: "Humor Flavors",
    subtitle: "Read-only overview of configured humor flavor definitions.",
    mode: "read",
  },
  "humor-flavor-steps": {
    slug: "humor-flavor-steps",
    table: "humor_flavor_steps",
    title: "Humor Flavor Steps",
    subtitle: "Manage flavor step prompts with multiline prompt editors.",
    mode: "read-update",
    ui: {
      editFields: ["llm_system_prompt", "llm_user_prompt"],
      inlineEdit: true,
      fieldInputs: {
        llm_system_prompt: "textarea",
        llm_user_prompt: "textarea",
      },
    },
  },
  "humor-mix": {
    slug: "humor-mix",
    table: "humor_flavor_mix",
    title: "Humor Flavor Mix",
    subtitle: "Update humor flavor mix rows with inline field editing.",
    mode: "read-update",
    ui: {
      editFields: ["humor_flavor_id", "caption_count"],
      inlineEdit: true,
      fieldInputs: {
        humor_flavor_id: "number",
        caption_count: "number",
      },
    },
  },
  terms: {
    slug: "terms",
    table: "terms",
    title: "Terms",
    subtitle: "Manage glossary and term resources.",
    mode: "crud",
  },
  "caption-requests": {
    slug: "caption-requests",
    table: "caption_requests",
    title: "Caption Requests",
    subtitle: "Read-only queue of caption generation requests.",
    mode: "read",
  },
  "caption-examples": {
    slug: "caption-examples",
    table: "captions_examples",
    title: "Caption Examples",
    subtitle: "Create and edit caption examples in modal forms.",
    mode: "crud",
    ui: {
      createFields: ["image_description", "caption", "explanation"],
      editFields: ["image_description", "caption", "explanation"],
      modalCreate: true,
      modalEdit: true,
      fieldInputs: {
        image_description: "textarea",
        caption: "textarea",
        explanation: "textarea",
      },
    },
  },
  "llm-models": {
    slug: "llm-models",
    table: "llm_models",
    title: "LLM Models",
    subtitle: "Manage model catalog entries.",
    mode: "crud",
  },
  "llm-providers": {
    slug: "llm-providers",
    table: "llm_providers",
    title: "LLM Providers",
    subtitle: "Manage LLM provider records.",
    mode: "crud",
  },
  "llm-prompt-chains": {
    slug: "llm-prompt-chains",
    table: "llm_prompt_chains",
    title: "LLM Prompt Chains",
    subtitle: "Read-only inspection of prompt-chain definitions.",
    mode: "read",
  },
  "llm-responses": {
    slug: "llm-responses",
    table: "llm_model_responses",
    title: "LLM Responses",
    subtitle: "Read-only review of generated LLM responses.",
    mode: "read",
  },
  "allowed-signup-domains": {
    slug: "allowed-signup-domains",
    table: "allowed_signup_domains",
    title: "Allowed Signup Domains",
    subtitle: "Manage domains allowed to register.",
    mode: "crud",
  },
  "whitelist-email-addresses": {
    slug: "whitelist-email-addresses",
    table: "whitelist_email_addresses",
    title: "Whitelist Email Addresses",
    subtitle: "Manage explicitly allowed email addresses.",
    mode: "crud",
  },
  "whitelisted-email-addresses": {
    slug: "whitelisted-email-addresses",
    table: "whitelist_email_addresses",
    title: "Whitelisted Email Addresses",
    subtitle: "Manage explicitly allowed email addresses.",
    mode: "crud",
  },
  whitelist_email_addresses: {
    slug: "whitelist_email_addresses",
    table: "whitelist_email_addresses",
    title: "Whitelist Email Addresses",
    subtitle: "Manage explicitly allowed email addresses.",
    mode: "crud",
  },
};

export type AdminNavSection = {
  title: string;
  items: Array<{ href: string; label: string }>;
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Dashboard",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    title: "Users",
    items: [{ href: "/admin/users", label: "Users" }],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/images", label: "Images" },
      { href: "/admin/captions", label: "Captions" },
      { href: "/admin/caption-requests", label: "Caption Requests" },
      { href: "/admin/caption-examples", label: "Caption Examples" },
      { href: "/admin/terms", label: "Terms" },
      { href: "/admin/votes", label: "Votes" },
    ],
  },
  {
    title: "Humor System",
    items: [
      { href: "/admin/humor-themes", label: "Humor Themes" },
      { href: "/admin/humor-flavors", label: "Humor Flavors" },
      { href: "/admin/humor-flavor-steps", label: "Humor Flavor Steps" },
      { href: "/admin/humor-mix", label: "Humor Mix" },
    ],
  },
  {
    title: "LLM",
    items: [
      { href: "/admin/llm-providers", label: "LLM Providers" },
      { href: "/admin/llm-models", label: "LLM Models" },
      { href: "/admin/llm-prompt-chains", label: "LLM Prompt Chains" },
      { href: "/admin/llm-responses", label: "LLM Responses" },
    ],
  },
  {
    title: "Access Control",
    items: [
      { href: "/admin/allowed-signup-domains", label: "Allowed Signup Domains" },
      { href: "/admin/whitelist-email-addresses", label: "Whitelist Email Addresses" },
    ],
  },
];
