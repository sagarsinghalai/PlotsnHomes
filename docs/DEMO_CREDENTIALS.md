# PlotsnHomes Demo Credentials

These credentials are for local development and testing only. They must never be exposed in a production environment.

## Administrator

* **Email**: `admin@plotsnhomes.com`
* **Password**: `demo1234`

## Investor

* **Email**: `investor@plotsnhomes.com`
* **Password**: `demo1234`

## Buyer

* **Email**: `buyer@plotsnhomes.com`
* **Password**: `demo1234`

## Agent

* **Email**: `agent1@plotsnhomes.com`
* **Password**: `demo1234`

## Default Password

The default password for all seed/demo accounts is `demo1234`.

## Notes

- **Never** expose these credentials in production.
- These users are created by [seed.ts](file:///Users/bhavyapandey/Downloads/Realestate%20CRM/Real-estate-main/prisma/seed.ts).
- If login fails locally, run the following command to regenerate the database users:

```bash
npm run db:seed
```

then restart the development server.

## Related Files

The following files manage or utilize these test credentials:
- [prisma/seed.ts](file:///Users/bhavyapandey/Downloads/Realestate%20CRM/Real-estate-main/prisma/seed.ts)
- [scripts/ensure-admin.ts](file:///Users/bhavyapandey/Downloads/Realestate%20CRM/Real-estate-main/scripts/ensure-admin.ts)
- [scripts/check-admin.ts](file:///Users/bhavyapandey/Downloads/Realestate%20CRM/Real-estate-main/scripts/check-admin.ts)
- [scripts/verify-admin.ts](file:///Users/bhavyapandey/Downloads/Realestate%20CRM/Real-estate-main/scripts/verify-admin.ts)
