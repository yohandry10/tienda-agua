import { sqliteTable, text, integer, uniqueIndex, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const orders = sqliteTable("orders", {
 id:text("id").primaryKey(), requestId:text("request_id").notNull(), fingerprint:text("fingerprint").notNull(), userId:text("user_id"), creatorId:text("creator_id"),
 name:text("name").notNull(), phone:text("phone").notNull(), address:text("address").notNull(), district:text("district").notNull(),
 kind:text("kind").notNull(), payment:text("payment").notNull(), notes:text("notes").notNull(), items:text("items").notNull(),
 total:integer("total").notNull(), status:text("status").notNull().default("pendiente"), channel:text("channel").notNull().default("web"), createdAt:text("created_at").notNull(), updatedAt:text("updated_at").notNull(), email:text("email"), paymentMode:text("payment_mode"), paymentStatus:text("payment_status").notNull().default("pendiente")
},table=>[uniqueIndex("orders_request_id").on(table.requestId)]);
export const team = sqliteTable("team", {email:text("email").primaryKey(), role:text("role").notNull(), createdAt:text("created_at").notNull()});
export const paymentAttempts = sqliteTable("payment_attempts", {
 id:text("id").primaryKey(), orderId:text("order_id").notNull().references(()=>orders.id), mode:text("mode").notNull(), token:text("token").notNull().unique(), transId:text("trans_id").notNull(), transDate:text("trans_date").notNull(), transDay:text("trans_day").notNull(), amount:integer("amount").notNull(), state:text("state").notNull().default("pendiente"), gatewayStatus:text("gateway_status"), gatewayUuid:text("gateway_uuid"), createdAt:text("created_at").notNull(), updatedAt:text("updated_at").notNull()
},table=>[uniqueIndex("payment_daily_transaction").on(table.mode,table.transDay,table.transId),uniqueIndex("payment_open_attempt").on(table.orderId,table.mode).where(sql`${table.state} IN ('pendiente','autorizado','pagado')`),index("payment_order_lookup").on(table.orderId,table.createdAt),check("payment_mode_valid",sql`${table.mode} IN ('TEST','PRODUCTION')`)]);
