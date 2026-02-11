import { createAccessControl } from "better-auth/plugins/access";
import {defaultStatements as defaultAdminStatement} from "better-auth/plugins/admin/access";
import {defaultStatements as defaultAdminOrgsStatement} from "better-auth/plugins/organization/access";

const statement = {
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  transaction: ["create", "read", "update", "delete", "refund"],
  outlet: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const superadmin = ac.newRole({
  ...defaultAdminStatement,
  ...defaultAdminOrgsStatement,
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  transaction: ["create", "read", "update", "delete", "refund"],
  outlet: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
});

export const owner = ac.newRole({
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  transaction: ["create", "read", "update", "delete", "refund"],
  outlet: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
});

export const cashier = ac.newRole({
  product: ["read"],
  category: ["read"],
  transaction: ["create", "read"],
  outlet: ["read"],
  report: ["read"],
  settings: ["read"],
});

export type Role = "superadmin" | "owner" | "cashier";
export type Permission = keyof typeof statement;
