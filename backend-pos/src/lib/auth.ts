import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, organization } from "better-auth/plugins";
import { db } from "../db";
import { ac, superadmin, owner, cashier } from "./permissions";


export const auth = betterAuth({
  url: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ["http://localhost:3000"],
  plugins: [
    organization({
      teams: {
        enabled: true,
        maximumTeams: 50,
      },
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      membershipLimit: 100,
      creatorRole: "owner",
      schema: {
        organization: {
          additionalFields: {
            address: { type: "string", input: true, required: false },
            phone: { type: "string", input: true, required: false },
          },
        },
        team: {
          additionalFields: {
            outletCode: { type: "string", input: true, required: false },
            address: { type: "string", input: true, required: false },
          },
        },
      },
    }),
    admin({
      ac,
      roles: {
        superadmin,
        owner,
        cashier,
      },
    }),
    openAPI(),
  ],
});