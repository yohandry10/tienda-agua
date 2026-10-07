import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
export const orders = sqliteTable("orders", {
 id:text("id").primaryKey(), requestId:text("request_id").notNull(), fingerprint:text("fingerprint").notNull(), userId:text("user_id"), creatorId:text("creator_id"),
 name:text("name").notNull(), phone:text("phone").notNull(), address:text("address").notNull(), district:text("district").notNull(),
 kind:text("kind").notNull(), payment:text("payment").notNull(), notes:text("notes").notNull(), items:text("items").notNull(),
 total:integer("total").notNull(), status:text("status").notNull().default("pendiente"), channel:text("channel").notNull().default("web"), createdAt:text("created_at").notNull(), updatedAt:text("updated_at").notNull()
},table=>[uniqueIndex("orders_request_id").on(table.requestId)]);
export const team = sqliteTable("team", {email:text("email").primaryKey(), role:text("role").notNull(), createdAt:text("created_at").notNull()});

