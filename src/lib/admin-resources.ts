import { albums, comments, contactMessages, concerts, media, newsletters, orders, pages, posts, products, socialLinks, subscribers, ticketTypes, tracks, admins, settings, syncLogs, emailLogs } from "@/db/schema";

export type FieldType =
  | "text"
  | "textarea"
  | "rich"
  | "number"
  | "checkbox"
  | "select"
  | "date"
  | "json"
  | "image"
  | "readonly";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: Array<{ value: string; label: string }>;
  ref?: string;
  refLabel?: string;
  help?: string;
  half?: boolean;
};

export type ResourceConfig = {
  key: string;
  label: string;
  singular: string;
  table: any;
  titleField: string;
  fields: Field[];
  columns: string[];
  readOnly?: boolean;
  searchable?: string[];
};

const publishedField: Field = { name: "published", label: "Visible on site", type: "checkbox", half: true };

export const RESOURCES: Record<string, ResourceConfig> = {
  tracks: {
    key: "tracks",
    label: "Music & Songs",
    singular: "track",
    table: tracks,
    titleField: "title",
    columns: ["title", "artist", "year", "source", "featured", "published"],
    searchable: ["title", "artist"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "slug", label: "URL slug", type: "text", half: true, help: "Used in /music?track=slug" },
      { name: "artist", label: "Artist", type: "text", half: true },
      { name: "albumId", label: "Album", type: "select", ref: "albums", refLabel: "title", half: true },
      { name: "year", label: "Release year", type: "number", half: true },
      { name: "durationSec", label: "Duration (seconds)", type: "number", half: true },
      { name: "coverUrl", label: "Cover image", type: "image" },
      { name: "audioUrl", label: "Audio file (mp3 / m4a URL)", type: "text" },
      { name: "youtubeId", label: "YouTube video ID", type: "text", half: true },
      { name: "instagramUrl", label: "Instagram post URL", type: "text", half: true },
      { name: "price", label: "Price", type: "number", half: true },
      { name: "source", label: "Source", type: "select", options: [
        { value: "admin", label: "Uploaded by admin" },
        { value: "youtube", label: "YouTube sync" },
        { value: "instagram", label: "Instagram sync" },
      ], half: true },
      { name: "lyrics", label: "Lyrics", type: "textarea" },
      { name: "credits", label: "Credits", type: "textarea" },
      { name: "featured", label: "Featured", type: "checkbox", half: true },
      publishedField,
    ],
  },
  albums: {
    key: "albums",
    label: "Albums & EPs",
    singular: "album",
    table: albums,
    titleField: "title",
    columns: ["title", "year", "price", "featured", "published"],
    searchable: ["title"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "slug", label: "URL slug", type: "text", half: true },
      { name: "year", label: "Year", type: "number", half: true },
      { name: "price", label: "Price", type: "number", half: true },
      { name: "currency", label: "Currency", type: "text", half: true },
      { name: "coverUrl", label: "Cover image", type: "image" },
      { name: "description", label: "Description", type: "rich" },
      { name: "sortOrder", label: "Sort order", type: "number", half: true },
      { name: "featured", label: "Featured", type: "checkbox", half: true },
      publishedField,
    ],
  },
  products: {
    key: "products",
    label: "Store & Merch",
    singular: "product",
    table: products,
    titleField: "title",
    columns: ["title", "category", "price", "stock", "published"],
    searchable: ["title", "category"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "slug", label: "URL slug", type: "text", half: true },
      { name: "category", label: "Category", type: "select", options: [
        { value: "apparel", label: "Apparel" },
        { value: "music", label: "Music" },
        { value: "prints", label: "Prints" },
        { value: "accessories", label: "Accessories" },
      ], half: true },
      { name: "price", label: "Price", type: "number", half: true },
      { name: "currency", label: "Currency", type: "text", half: true },
      { name: "stock", label: "Stock", type: "number", half: true },
      { name: "imageUrl", label: "Product image", type: "image" },
      { name: "description", label: "Description", type: "rich" },
      { name: "sortOrder", label: "Sort order", type: "number", half: true },
      { name: "featured", label: "Featured", type: "checkbox", half: true },
      publishedField,
    ],
  },
  concerts: {
    key: "concerts",
    label: "Concerts",
    singular: "concert",
    table: concerts,
    titleField: "title",
    columns: ["title", "venue", "startsAt", "status", "published"],
    searchable: ["title", "venue", "city"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "slug", label: "URL slug", type: "text", half: true },
      { name: "status", label: "Status", type: "select", options: [
        { value: "upcoming", label: "Upcoming" },
        { value: "past", label: "Past event" },
        { value: "cancelled", label: "Cancelled" },
      ], half: true },
      { name: "venue", label: "Venue", type: "text", half: true },
      { name: "city", label: "City", type: "text", half: true },
      { name: "country", label: "Country", type: "text", half: true },
      { name: "startsAt", label: "Starts", type: "date", half: true },
      { name: "endsAt", label: "Ends", type: "date", half: true },
      { name: "doorsAt", label: "Doors open", type: "date", half: true },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "description", label: "Description", type: "rich" },
      { name: "coverUrl", label: "Cover image", type: "image" },
      { name: "gallery", label: "Photo gallery (JSON array of URLs)", type: "json" },
      { name: "videos", label: "Video IDs (JSON array of YouTube IDs)", type: "json" },
      { name: "streamUrl", label: "Stream URL", type: "text" },
      { name: "featured", label: "Featured", type: "checkbox", half: true },
      publishedField,
    ],
  },
  ticketTypes: {
    key: "ticketTypes",
    label: "Ticket Tiers",
    singular: "ticket tier",
    table: ticketTypes,
    titleField: "name",
    columns: ["name", "concertId", "price", "quantityTotal", "quantitySold", "published"],
    searchable: ["name"],
    fields: [
      { name: "concertId", label: "Concert", type: "select", ref: "concerts", refLabel: "title" },
      { name: "name", label: "Tier name", type: "text", half: true },
      { name: "price", label: "Price", type: "number", half: true },
      { name: "currency", label: "Currency", type: "text", half: true },
      { name: "quantityTotal", label: "Seats available", type: "number", half: true },
      { name: "quantitySold", label: "Seats sold", type: "number", half: true },
      { name: "description", label: "Description", type: "text" },
      { name: "sortOrder", label: "Sort order", type: "number", half: true },
      publishedField,
    ],
  },
  orders: {
    key: "orders",
    label: "Orders & Bookings",
    singular: "order",
    table: orders,
    titleField: "ref",
    columns: ["ref", "customerName", "type", "total", "paymentMethod", "status"],
    searchable: ["ref", "customerName", "email"],
    fields: [
      { name: "ref", label: "Reference", type: "readonly", half: true },
      { name: "type", label: "Type", type: "select", options: [
        { value: "ticket", label: "Ticket" },
        { value: "product", label: "Merchandise" },
      ], half: true },
      { name: "status", label: "Status", type: "select", options: [
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ], half: true },
      { name: "customerName", label: "Customer", type: "text", half: true },
      { name: "email", label: "Email", type: "text", half: true },
      { name: "phone", label: "Phone", type: "text", half: true },
      { name: "paymentMethod", label: "Payment method", type: "text", half: true },
      { name: "paymentRef", label: "Payment reference", type: "text", half: true },
      { name: "total", label: "Total", type: "readonly", half: true },
      { name: "items", label: "Items", type: "json" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  posts: {
    key: "posts",
    label: "News & Blog",
    singular: "article",
    table: posts,
    titleField: "title",
    columns: ["title", "category", "author", "publishedAt", "views", "published"],
    searchable: ["title", "excerpt"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "slug", label: "URL slug", type: "text", half: true },
      { name: "category", label: "Category", type: "select", options: [
        { value: "news", label: "News" },
        { value: "release", label: "Release" },
        { value: "events", label: "Events" },
        { value: "devotional", label: "Devotional" },
        { value: "press", label: "Press" },
      ], half: true },
      { name: "author", label: "Author", type: "text", half: true },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "content", label: "Article body", type: "rich" },
      { name: "coverUrl", label: "Cover image", type: "image" },
      { name: "sourceName", label: "Source name", type: "text", half: true },
      { name: "sourceUrl", label: "Source URL", type: "text", half: true },
      { name: "publishedAt", label: "Publish date", type: "date", half: true },
      { name: "tags", label: "Tags (JSON array)", type: "json" },
      { name: "seoTitle", label: "SEO title", type: "text" },
      { name: "seoDescription", label: "SEO description", type: "textarea" },
      { name: "featured", label: "Featured", type: "checkbox", half: true },
      publishedField,
    ],
  },
  comments: {
    key: "comments",
    label: "Comments",
    singular: "comment",
    table: comments,
    titleField: "authorName",
    columns: ["authorName", "postId", "status", "createdAt"],
    searchable: ["authorName", "body"],
    fields: [
      { name: "postId", label: "Article", type: "select", ref: "posts", refLabel: "title" },
      { name: "authorName", label: "Author", type: "text", half: true },
      { name: "email", label: "Email", type: "text", half: true },
      { name: "status", label: "Status", type: "select", options: [
        { value: "approved", label: "Approved" },
        { value: "pending", label: "Pending" },
        { value: "spam", label: "Spam" },
      ], half: true },
      { name: "parentId", label: "Parent comment ID (for replies)", type: "number", half: true },
      { name: "body", label: "Comment", type: "textarea" },
    ],
  },
  pages: {
    key: "pages",
    label: "Pages",
    singular: "page",
    table: pages,
    titleField: "title",
    columns: ["title", "slug", "published"],
    searchable: ["title", "slug"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "slug", label: "Slug", type: "text", half: true },
      { name: "content", label: "Content", type: "rich" },
      { name: "seoTitle", label: "SEO title", type: "text" },
      { name: "seoDescription", label: "SEO description", type: "textarea" },
      publishedField,
    ],
  },
  media: {
    key: "media",
    label: "File Manager",
    singular: "file",
    table: media,
    titleField: "title",
    columns: ["title", "type", "category", "source", "publishedAt"],
    searchable: ["title", "category", "source"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "type", label: "Type", type: "select", options: [
        { value: "image", label: "Image" },
        { value: "video", label: "Video" },
        { value: "audio", label: "Audio" },
        { value: "document", label: "Document" },
      ], half: true },
      { name: "category", label: "Category", type: "text", half: true },
      { name: "source", label: "Source", type: "select", options: [
        { value: "upload", label: "Upload" },
        { value: "youtube", label: "YouTube sync" },
        { value: "instagram", label: "Instagram sync" },
        { value: "facebook", label: "Facebook sync" },
        { value: "x", label: "X sync" },
      ], half: true },
      { name: "url", label: "File URL", type: "text" },
      { name: "thumbnailUrl", label: "Thumbnail URL", type: "image" },
      { name: "externalId", label: "External ID", type: "text", half: true },
      { name: "externalUrl", label: "External URL", type: "text", half: true },
      { name: "mimeType", label: "MIME type", type: "text", half: true },
      { name: "publishedAt", label: "Published date", type: "date", half: true },
      publishedField,
    ],
  },
  socialLinks: {
    key: "socialLinks",
    label: "Social Links",
    singular: "link",
    table: socialLinks,
    titleField: "label",
    columns: ["platform", "label", "url", "enabled"],
    searchable: ["platform", "label"],
    fields: [
      { name: "platform", label: "Platform", type: "select", options: [
        { value: "instagram", label: "Instagram" },
        { value: "youtube", label: "YouTube" },
        { value: "facebook", label: "Facebook" },
        { value: "x", label: "X" },
        { value: "apple", label: "Apple Music" },
        { value: "shazam", label: "Shazam" },
        { value: "afrocharts", label: "Afrocharts" },
      ], half: true },
      { name: "label", label: "Label", type: "text", half: true },
      { name: "url", label: "URL", type: "text" },
      { name: "sortOrder", label: "Sort order", type: "number", half: true },
      { name: "enabled", label: "Enabled", type: "checkbox", half: true },
    ],
  },
  subscribers: {
    key: "subscribers",
    label: "Subscribers",
    singular: "subscriber",
    table: subscribers,
    titleField: "email",
    columns: ["email", "name", "status", "source", "createdAt"],
    searchable: ["email", "name"],
    fields: [
      { name: "email", label: "Email", type: "text", half: true },
      { name: "name", label: "Name", type: "text", half: true },
      { name: "status", label: "Status", type: "select", options: [
        { value: "active", label: "Active" },
        { value: "unsubscribed", label: "Unsubscribed" },
      ], half: true },
      { name: "source", label: "Source", type: "text", half: true },
    ],
  },
  newsletters: {
    key: "newsletters",
    label: "Newsletters",
    singular: "newsletter",
    table: newsletters,
    titleField: "subject",
    columns: ["subject", "status", "recipientsCount", "sentAt"],
    searchable: ["subject"],
    fields: [
      { name: "subject", label: "Subject line", type: "text" },
      { name: "preheader", label: "Preheader", type: "text" },
      { name: "body", label: "Email body", type: "rich" },
      { name: "status", label: "Status", type: "select", options: [
        { value: "draft", label: "Draft (sends on schedule)" },
        { value: "sent", label: "Sent" },
      ], half: true },
      { name: "recipientsCount", label: "Recipients", type: "readonly", half: true },
    ],
  },
  contactMessages: {
    key: "contactMessages",
    label: "Contact Messages",
    singular: "message",
    table: contactMessages,
    titleField: "subject",
    columns: ["name", "subject", "status", "createdAt"],
    searchable: ["name", "subject", "message"],
    fields: [
      { name: "name", label: "Name", type: "text", half: true },
      { name: "email", label: "Email", type: "text", half: true },
      { name: "subject", label: "Subject", type: "text", half: true },
      { name: "status", label: "Status", type: "select", options: [
        { value: "new", label: "New" },
        { value: "replied", label: "Replied" },
        { value: "archived", label: "Archived" },
      ], half: true },
      { name: "message", label: "Message", type: "textarea" },
    ],
  },
  admins: {
    key: "admins",
    label: "Admin Users",
    singular: "admin",
    table: admins,
    titleField: "username",
    columns: ["username", "email", "role", "lastLoginAt"],
    searchable: ["username", "email"],
    fields: [
      { name: "username", label: "Username", type: "text", half: true },
      { name: "email", label: "Email", type: "text", half: true },
      { name: "role", label: "Role", type: "select", options: [
        { value: "admin", label: "Admin" },
        { value: "superadmin", label: "Super admin" },
      ], half: true },
    ],
  },
  settings: {
    key: "settings",
    label: "Site Settings",
    singular: "setting",
    table: settings,
    titleField: "key",
    columns: ["key"],
    searchable: ["key"],
    fields: [
      { name: "key", label: "Key", type: "readonly", half: true },
      { name: "value", label: "Value (JSON)", type: "json" },
    ],
  },
  syncLogs: {
    key: "syncLogs",
    label: "Sync Log",
    singular: "log",
    table: syncLogs,
    titleField: "source",
    columns: ["source", "status", "itemsCount", "createdAt"],
    readOnly: true,
    fields: [
      { name: "source", label: "Source", type: "readonly", half: true },
      { name: "status", label: "Status", type: "readonly", half: true },
      { name: "itemsCount", label: "Items", type: "readonly", half: true },
      { name: "message", label: "Message", type: "readonly" },
    ],
  },
  emailLogs: {
    key: "emailLogs",
    label: "Email Log",
    singular: "log",
    table: emailLogs,
    titleField: "subject",
    columns: ["to", "subject", "kind", "status"],
    readOnly: true,
    fields: [
      { name: "to", label: "To", type: "readonly", half: true },
      { name: "subject", label: "Subject", type: "readonly", half: true },
      { name: "kind", label: "Kind", type: "readonly", half: true },
      { name: "status", label: "Status", type: "readonly", half: true },
    ],
  },
};

export const NAV_GROUPS: Array<{ label: string; items: string[] }> = [
  { label: "Content", items: ["tracks", "albums", "concerts", "ticketTypes", "posts", "pages"] },
  { label: "Commerce", items: ["products", "orders"] },
  { label: "Audience", items: ["subscribers", "newsletters", "comments", "contactMessages"] },
  { label: "Media", items: ["media", "syncLogs", "emailLogs"] },
  { label: "System", items: ["socialLinks", "settings", "admins"] },
];
